import { db } from "@/db";
import { options } from "@/db/schema";
import { eq } from "drizzle-orm";

interface OptionRow {
  label: string;
  quantity: string;
  strikePriceUsd: string;
  currentPriceUsd: string;
  valueIls: string;
  isVested: boolean;
}

export async function addOptions(snapshotId: number, rows: OptionRow[]) {
  const values = rows.map((r) => ({ snapshotId, ...r }));
  return db.insert(options).values(values).returning();
}

export async function getOptionsForSnapshot(snapshotId: number) {
  return db.select().from(options).where(eq(options.snapshotId, snapshotId));
}
