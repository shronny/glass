import { db } from "@/db";
import { snapshots } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function createSnapshot(month: number, year: number, notes?: string) {
  const snapshotDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const [row] = await db.insert(snapshots).values({ snapshotDate, notes }).returning();
  return row;
}

export async function listSnapshots() {
  return db.select({
    id: snapshots.id,
    snapshotDate: snapshots.snapshotDate,
    notes: snapshots.notes,
  }).from(snapshots).orderBy(desc(snapshots.snapshotDate));
}

export async function getSnapshotById(id: number) {
  const [row] = await db.select().from(snapshots).where(eq(snapshots.id, id));
  return row ?? null;
}
