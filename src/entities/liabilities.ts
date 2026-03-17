import { db } from "@/db";
import { liabilities } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface LiabilityRow {
  label: string;
  balanceIls: string;
}

export async function addLiabilities(snapshotId: number, rows: LiabilityRow[]) {
  const values = rows.map((r) => ({ snapshotId, ...r }));
  return db.insert(liabilities).values(values).returning();
}

export async function getLiabilitiesForSnapshot(snapshotId: number) {
  return db.select().from(liabilities).where(eq(liabilities.snapshotId, snapshotId));
}
