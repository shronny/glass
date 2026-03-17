import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { getLatestFxRate } from "@/entities/fx";
import { addOptions } from "@/entities/options";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  if (isNaN(snapshotId)) {
    return NextResponse.json({ error: "Invalid snapshot ID" }, { status: 400 });
  }

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

  const invalid = rows.some(
    (r: Record<string, unknown>) =>
      typeof r.label !== "string" || r.label.trim() === "" ||
      typeof r.quantity !== "number" || r.quantity <= 0 ||
      typeof r.strike_price_usd !== "number" ||
      typeof r.current_price_usd !== "number" ||
      typeof r.is_vested !== "boolean"
  );
  if (invalid) {
    return NextResponse.json(
      { error: "Each row must have label (string), quantity (number > 0), strike_price_usd (number), current_price_usd (number), is_vested (boolean)" },
      { status: 400 }
    );
  }

  const rate = Number(fxRate.usdToIls);
  const optionRows = rows.map((r: {
    label: string;
    quantity: number;
    strike_price_usd: number;
    current_price_usd: number;
    is_vested: boolean;
  }) => ({
    label: r.label,
    quantity: String(r.quantity),
    strikePriceUsd: String(r.strike_price_usd),
    currentPriceUsd: String(r.current_price_usd),
    valueIls: (Number(r.quantity) * (Number(r.current_price_usd) - Number(r.strike_price_usd)) * rate).toFixed(2),
    isVested: r.is_vested,
  }));

  try {
    const inserted = await addOptions(snapshotId, optionRows);
    return NextResponse.json(inserted, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
