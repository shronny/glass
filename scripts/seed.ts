import { db } from "../src/db";
import {
  snapshots, stocks, options, kerenHishtalmut,
  kupatHisachon, liabilities, monthlyCashflow, fxRates,
} from "../src/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clear all tables (cascade handles FK dependencies)
  await db.execute(sql`TRUNCATE TABLE monthly_cashflow, liabilities, kupat_hisachon, keren_hishtalmut, options, stocks, fx_rates, snapshots RESTART IDENTITY CASCADE`);
  console.log("Cleared existing data.");

  // Create January 2025 snapshot
  const [snapshot] = await db.insert(snapshots).values({
    snapshotDate: "2025-01-01",
    notes: "Seed data - January 2025",
  }).returning();

  console.log(`Created snapshot: ${snapshot.id}`);

  // FX rate
  await db.insert(fxRates).values({
    snapshotId: snapshot.id,
    usdToIls: "3.72",
  });

  const rate = 3.72;

  // Stocks
  await db.insert(stocks).values([
    {
      snapshotId: snapshot.id,
      ticker: "AAPL",
      quantity: "100",
      priceUsd: "175.50",
      valueIls: (100 * 175.50 * rate).toFixed(2),
    },
    {
      snapshotId: snapshot.id,
      ticker: "MSFT",
      quantity: "50",
      priceUsd: "380.00",
      valueIls: (50 * 380 * rate).toFixed(2),
    },
  ]);

  // Options (employee stock options)
  await db.insert(options).values([
    {
      snapshotId: snapshot.id,
      label: "Grant A 2022",
      quantity: "1000",
      strikePriceUsd: "50.00",
      currentPriceUsd: "85.00",
      valueIls: (1000 * (85 - 50) * rate).toFixed(2),
      isVested: true,
    },
    {
      snapshotId: snapshot.id,
      label: "Grant B 2023",
      quantity: "500",
      strikePriceUsd: "70.00",
      currentPriceUsd: "85.00",
      valueIls: (500 * (85 - 70) * rate).toFixed(2),
      isVested: false,
    },
  ]);

  // Keren Hishtalmut (savings funds)
  await db.insert(kerenHishtalmut).values([
    {
      snapshotId: snapshot.id,
      accountLabel: "Migdal",
      balanceIls: "85000.00",
    },
    {
      snapshotId: snapshot.id,
      accountLabel: "Harel",
      balanceIls: "62000.00",
    },
  ]);

  // Kupat Hisachon (pension)
  await db.insert(kupatHisachon).values([
    {
      snapshotId: snapshot.id,
      provider: "Meitav",
      balanceIls: "320000.00",
    },
  ]);

  // Liabilities
  await db.insert(liabilities).values([
    {
      snapshotId: snapshot.id,
      label: "Car loan",
      balanceIls: "45000.00",
    },
  ]);

  // Monthly cashflow
  const income = 32000;
  const expenses = 24500;
  await db.insert(monthlyCashflow).values([
    {
      snapshotId: snapshot.id,
      incomeIls: String(income),
      expensesIls: String(expenses),
      freeCashIls: String(income - expenses),
    },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
