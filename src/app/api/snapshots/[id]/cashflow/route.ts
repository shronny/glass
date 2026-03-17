import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addCashflow } from "@/entities/cashflow";

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

  const body = await request.json();
  const { income_ils, expenses_ils } = body;

  if (income_ils == null || expenses_ils == null) {
    return NextResponse.json({ error: "income_ils and expenses_ils are required" }, { status: 400 });
  }

  if (Number(income_ils) < 0 || Number(expenses_ils) < 0) {
    return NextResponse.json({ error: "Values must be non-negative" }, { status: 400 });
  }

  try {
    const row = await addCashflow(snapshotId, String(income_ils), String(expenses_ils));
    return NextResponse.json(row, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
