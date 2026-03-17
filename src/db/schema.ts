import {
  pgTable,
  serial,
  date,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const snapshots = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("snapshots_date_unique").on(table.snapshotDate),
]);

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  ticker: text("ticker").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull(),
  priceUsd: numeric("price_usd", { precision: 18, scale: 4 }).notNull(),
  valueIls: numeric("value_ils", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("stocks_snapshot_id_idx").on(table.snapshotId),
]);

export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  label: text("label").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull(),
  strikePriceUsd: numeric("strike_price_usd", { precision: 18, scale: 4 }).notNull(),
  currentPriceUsd: numeric("current_price_usd", { precision: 18, scale: 4 }).notNull(),
  valueIls: numeric("value_ils", { precision: 18, scale: 2 }).notNull(),
  isVested: boolean("is_vested").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("options_snapshot_id_idx").on(table.snapshotId),
]);

export const kerenHishtalmut = pgTable("keren_hishtalmut", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  accountLabel: text("account_label").notNull(),
  balanceIls: numeric("balance_ils", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("keren_hishtalmut_snapshot_id_idx").on(table.snapshotId),
]);

export const kupatHisachon = pgTable("kupat_hisachon", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  provider: text("provider").notNull(),
  balanceIls: numeric("balance_ils", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("kupat_hisachon_snapshot_id_idx").on(table.snapshotId),
]);

export const liabilities = pgTable("liabilities", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  label: text("label").notNull(),
  balanceIls: numeric("balance_ils", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("liabilities_snapshot_id_idx").on(table.snapshotId),
]);

export const monthlyCashflow = pgTable("monthly_cashflow", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  incomeIls: numeric("income_ils", { precision: 18, scale: 2 }).notNull(),
  expensesIls: numeric("expenses_ils", { precision: 18, scale: 2 }).notNull(),
  freeCashIls: numeric("free_cash_ils", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("monthly_cashflow_snapshot_id_idx").on(table.snapshotId),
]);

export const fxRates = pgTable("fx_rates", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id),
  usdToIls: numeric("usd_to_ils", { precision: 18, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("fx_rates_snapshot_id_idx").on(table.snapshotId),
]);
