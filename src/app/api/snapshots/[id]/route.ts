import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { getStocksForSnapshot } from "@/entities/stocks";
import { getOptionsForSnapshot } from "@/entities/options";
import { getSavingsForSnapshot } from "@/entities/savings";
import { getPensionForSnapshot } from "@/entities/pension";
import { getLiabilitiesForSnapshot } from "@/entities/liabilities";
import { getCashflowForSnapshot } from "@/entities/cashflow";
import { getFxRatesForSnapshot } from "@/entities/fx";
import { computeMetrics } from "@/lib/computedMetrics";

export async function GET(
  _request: NextRequest,
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

  const [stockRows, optionRows, savingsRows, pensionRows, liabilityRows, cashflowRows, fxRows] =
    await Promise.all([
      getStocksForSnapshot(snapshotId),
      getOptionsForSnapshot(snapshotId),
      getSavingsForSnapshot(snapshotId),
      getPensionForSnapshot(snapshotId),
      getLiabilitiesForSnapshot(snapshotId),
      getCashflowForSnapshot(snapshotId),
      getFxRatesForSnapshot(snapshotId),
    ]);

  const computed = computeMetrics({
    stocks: stockRows,
    options: optionRows,
    savings: savingsRows,
    pension: pensionRows,
    liabilities: liabilityRows,
    cashflow: cashflowRows,
  });

  return NextResponse.json({
    snapshot,
    stocks: stockRows,
    options: optionRows,
    savings: savingsRows,
    pension: pensionRows,
    liabilities: liabilityRows,
    cashflow: cashflowRows,
    fx_rates: fxRows,
    computed,
  });
}
