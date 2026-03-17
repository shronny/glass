import { db } from "@/db";
import { kupatHisachon } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface PensionRow {
  provider: string;
  balanceIls: string;
}

export async function addPension(snapshotId: number, rows: PensionRow[]) {
  const values = rows.map((r) => ({ snapshotId, ...r }));
  return db.insert(kupatHisachon).values(values).returning();
}

export async function getPensionForSnapshot(snapshotId: number) {
  return db.select().from(kupatHisachon).where(eq(kupatHisachon.snapshotId, snapshotId));
}
