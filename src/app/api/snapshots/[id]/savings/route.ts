import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addSavings } from "@/entities/savings";

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
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const invalid = rows.some(
    (r: Record<string, unknown>) =>
      typeof r.account_label !== "string" || r.account_label.trim() === "" ||
      typeof r.balance_ils !== "number" || r.balance_ils < 0
  );
  if (invalid) {
    return NextResponse.json(
      { error: "Each row must have account_label (string) and balance_ils (number >= 0)" },
      { status: 400 }
    );
  }

  const savingsRows = rows.map((r: { account_label: string; balance_ils: number }) => ({
    accountLabel: r.account_label,
    balanceIls: String(r.balance_ils),
  }));

  try {
    const inserted = await addSavings(snapshotId, savingsRows);
    return NextResponse.json(inserted, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
