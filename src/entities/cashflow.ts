import { db } from "@/db";
import { monthlyCashflow } from "@/db/schema";
import { eq } from "drizzle-orm";

// Subtract two decimal strings safely without floating-point error
function subtractDecimalStrings(a: string, b: string): string {
  const scale = 100; // 2 decimal places
  const aInt = Math.round(Number(a) * scale);
  const bInt = Math.round(Number(b) * scale);
  return ((aInt - bInt) / scale).toFixed(2);
}

export async function addCashflow(snapshotId: number, incomeIls: string, expensesIls: string) {
  const freeCashIls = subtractDecimalStrings(incomeIls, expensesIls);
  const [row] = await db.insert(monthlyCashflow).values({
    snapshotId,
    incomeIls,
    expensesIls,
    freeCashIls,
  }).returning();
  return row;
}

export async function getCashflowForSnapshot(snapshotId: number) {
  return db.select().from(monthlyCashflow).where(eq(monthlyCashflow.snapshotId, snapshotId));
}
