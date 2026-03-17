import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addFxRate } from "@/entities/fx";

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
  const { usd_to_ils } = body;

  if (!usd_to_ils || Number(usd_to_ils) <= 0) {
    return NextResponse.json({ error: "usd_to_ils must be a positive number" }, { status: 400 });
  }

  const row = await addFxRate(snapshotId, String(usd_to_ils));
  return NextResponse.json(row, { status: 201 });
}
