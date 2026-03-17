import { db } from "@/db";
import { kerenHishtalmut } from "@/db/schema";
import { eq } from "drizzle-orm";

interface SavingsRow {
  accountLabel: string;
  balanceIls: string;
}

export async function addSavings(snapshotId: number, rows: SavingsRow[]) {
  const values = rows.map((r) => ({ snapshotId, ...r }));
  return db.insert(kerenHishtalmut).values(values).returning();
}

export async function getSavingsForSnapshot(snapshotId: number) {
  return db.select().from(kerenHishtalmut).where(eq(kerenHishtalmut.snapshotId, snapshotId));
}
