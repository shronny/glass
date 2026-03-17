import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { getLatestFxRate } from "@/entities/fx";
import { addStocks } from "@/entities/stocks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const fxRate = await getLatestFxRate(snapshotId);
  if (!fxRate) {
    return NextResponse.json(
      { error: "No FX rate found for this snapshot. Add an FX rate first." },
      { status: 422 }
    );
  }

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const rate = Number(fxRate.usdToIls);
  const stockRows = rows.map((r: { ticker: string; quantity: number; price_usd: number }) => ({
    ticker: r.ticker,
    quantity: String(r.quantity),
    priceUsd: String(r.price_usd),
    valueIls: (Number(r.quantity) * Number(r.price_usd) * rate).toFixed(2),
  }));

  const inserted = await addStocks(snapshotId, stockRows);
  return NextResponse.json(inserted, { status: 201 });
}
