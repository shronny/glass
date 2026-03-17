import { db } from "@/db";
import { stocks } from "@/db/schema";
import { eq } from "drizzle-orm";

interface StockRow {
  ticker: string;
  quantity: string;
  priceUsd: string;
  valueIls: string;
}

export async function addStocks(snapshotId: number, rows: StockRow[]) {
  const values = rows.map((r) => ({ snapshotId, ...r }));
  return db.insert(stocks).values(values).returning();
}

export async function getStocksForSnapshot(snapshotId: number) {
  return db.select().from(stocks).where(eq(stocks.snapshotId, snapshotId));
}
