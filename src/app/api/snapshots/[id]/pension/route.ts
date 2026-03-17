import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addPension } from "@/entities/pension";

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

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const pensionRows = rows.map((r: { provider: string; balance_ils: number }) => ({
    provider: r.provider,
    balanceIls: String(r.balance_ils),
  }));

  const inserted = await addPension(snapshotId, pensionRows);
  return NextResponse.json(inserted, { status: 201 });
}
