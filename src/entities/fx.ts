import { db } from "@/db";
import { fxRates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function addFxRate(snapshotId: number, usdToIls: string) {
  const [row] = await db.insert(fxRates).values({ snapshotId, usdToIls }).returning();
  return row;
}

export async function getFxRatesForSnapshot(snapshotId: number) {
  return db.select().from(fxRates).where(eq(fxRates.snapshotId, snapshotId)).orderBy(desc(fxRates.createdAt));
}

export async function getLatestFxRate(snapshotId: number) {
  const [row] = await db.select().from(fxRates)
    .where(eq(fxRates.snapshotId, snapshotId))
    .orderBy(desc(fxRates.createdAt))
    .limit(1);
  return row ?? null;
}
