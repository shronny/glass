import { db } from "@/db";
import { monthlyCashflow } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function addCashflow(snapshotId: number, incomeIls: string, expensesIls: string) {
  const freeCashIls = (Number(incomeIls) - Number(expensesIls)).toFixed(2);
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
