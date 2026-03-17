# Financial Mirror M1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data foundation and snapshot entry flow for a local-only family financial dashboard.

**Architecture:** Next.js App Router with Drizzle ORM over PostgreSQL in Docker. Entity layer between API routes and database. Single long form UI for monthly snapshot entry. All data is append-only.

**Tech Stack:** Next.js 15, Drizzle ORM, PostgreSQL 15, Tailwind CSS, Docker Compose, Vitest

**Spec:** `docs/superpowers/specs/2026-03-17-financial-mirror-m1-design.md`

---

## Chunk 1: Project Scaffolding & Docker Infrastructure

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.gitignore`, `.env.example`

- [ ] **Step 1: Create Next.js app with Tailwind**

Run:
```bash
cd /Users/ronnysh/ws/Personal/Projects/Glass
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Select defaults when prompted.

- [ ] **Step 2: Verify the app runs locally**

Run: `npm run dev`
Expected: App starts on localhost:3000, shows Next.js welcome page. Stop it with Ctrl+C.

- [ ] **Step 3: Create .env.example**

Create `.env.example`:
```env
POSTGRES_USER=glass
POSTGRES_PASSWORD=change_me
POSTGRES_DB=glass
DATABASE_URL=postgresql://glass:change_me@db:5432/glass
```

- [ ] **Step 4: Create .env from example**

Run: `cp .env.example .env`

- [ ] **Step 5: Update .gitignore**

Add these lines to `.gitignore`:
```
.env
backups/
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Tailwind"
```

---

### Task 2: Docker Compose setup

**Files:**
- Create: `docker-compose.yml`
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile for Next.js app**

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

USER appuser

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

- [ ] **Step 2: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - glass-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - glass-net

  app:
    build: .
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - glass-net

volumes:
  glass-db-data:

networks:
  glass-net:
    driver: bridge
```

Key security points:
- `db` has NO `ports` section — not exposed to host
- `app` binds to `127.0.0.1:3000` only
- Both use non-root (alpine defaults + Dockerfile USER)

- [ ] **Step 3: Verify Docker Compose starts**

Run:
```bash
docker compose up --build -d
docker compose ps
```
Expected: Both `app` and `db` services running. App accessible at `http://127.0.0.1:3000`.

- [ ] **Step 4: Verify DB is NOT accessible from host**

Run:
```bash
psql -h 127.0.0.1 -p 5432 -U glass 2>&1 || echo "Connection refused — correct!"
```
Expected: Connection refused (port 5432 not exposed).

- [ ] **Step 5: Stop containers**

Run: `docker compose down`

- [ ] **Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Docker Compose with PostgreSQL and Next.js services"
```

---

## Chunk 2: Database Schema & Migrations

### Task 3: Install Drizzle ORM and configure

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/index.ts`
- Create: `src/db/schema.ts`
- Modify: `package.json` (add dependencies)

- [ ] **Step 1: Install Drizzle dependencies**

Run:
```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg tsx
```

- [ ] **Step 2: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Create database client**

Create `src/db/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

- [ ] **Step 4: Commit**

```bash
git add drizzle.config.ts src/db/index.ts package*.json
git commit -m "feat: configure Drizzle ORM with PostgreSQL"
```

---

### Task 4: Define database schema

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Write all table definitions**

Create `src/db/schema.ts`:
```typescript
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
```

- [ ] **Step 2: Generate migration**

Run:
```bash
docker compose up db -d
npx drizzle-kit generate
```
Expected: Migration file created in `src/db/migrations/`.

- [ ] **Step 3: Run migration against Docker DB**

Run:
```bash
npx drizzle-kit push
```
Expected: All 8 tables created successfully.

- [ ] **Step 4: Verify tables exist**

Run:
```bash
docker compose exec db psql -U glass -d glass -c "\dt"
```
Expected: Lists all 8 tables: snapshots, stocks, options, keren_hishtalmut, kupat_hisachon, liabilities, monthly_cashflow, fx_rates.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: define database schema with all 8 tables and generate migration"
```

---

## Chunk 3: Entity Layer & Computed Metrics

### Task 5: Entity layer — snapshots and fx

**Files:**
- Create: `src/entities/snapshots.ts`
- Create: `src/entities/fx.ts`

- [ ] **Step 1: Create snapshots entity**

Create `src/entities/snapshots.ts`:
```typescript
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
```

- [ ] **Step 2: Create fx entity**

Create `src/entities/fx.ts`:
```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/snapshots.ts src/entities/fx.ts
git commit -m "feat: add entity layer for snapshots and fx rates"
```

---

### Task 6: Entity layer — stocks and options

**Files:**
- Create: `src/entities/stocks.ts`
- Create: `src/entities/options.ts`

- [ ] **Step 1: Create stocks entity**

Create `src/entities/stocks.ts`:
```typescript
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
```

- [ ] **Step 2: Create options entity**

Create `src/entities/options.ts`:
```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/stocks.ts src/entities/options.ts
git commit -m "feat: add entity layer for stocks and options"
```

---

### Task 7: Entity layer — savings, pension, liabilities, cashflow

**Files:**
- Create: `src/entities/savings.ts`
- Create: `src/entities/pension.ts`
- Create: `src/entities/liabilities.ts`
- Create: `src/entities/cashflow.ts`

- [ ] **Step 1: Create savings entity**

Create `src/entities/savings.ts`:
```typescript
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
```

- [ ] **Step 2: Create pension entity**

Create `src/entities/pension.ts`:
```typescript
import { db } from "@/db";
import { kupatHisachon } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PensionRow {
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
```

- [ ] **Step 3: Create liabilities entity**

Create `src/entities/liabilities.ts`:
```typescript
import { db } from "@/db";
import { liabilities } from "@/db/schema";
import { eq } from "drizzle-orm";

interface LiabilityRow {
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
```

- [ ] **Step 4: Create cashflow entity**

Create `src/entities/cashflow.ts`:
```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/entities/savings.ts src/entities/pension.ts src/entities/liabilities.ts src/entities/cashflow.ts
git commit -m "feat: add entity layer for savings, pension, liabilities, and cashflow"
```

---

### Task 8: Computed metrics

**Files:**
- Create: `src/lib/computedMetrics.ts`
- Create: `src/lib/__tests__/computedMetrics.test.ts`

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest @vitejs/plugin-react
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Write tests for computed metrics**

Create `src/lib/__tests__/computedMetrics.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { computeMetrics } from "../computedMetrics";

describe("computeMetrics", () => {
  it("returns zeros for empty data", () => {
    const result = computeMetrics({
      stocks: [],
      options: [],
      savings: [],
      pension: [],
      liabilities: [],
      cashflow: [],
    });
    expect(result.netWorthIls).toBe(0);
    expect(result.liquidAssetsIls).toBe(0);
    expect(result.illiquidAssetsIls).toBe(0);
    expect(result.usdExposureIls).toBe(0);
    expect(result.ilsExposureIls).toBe(0);
    expect(result.monthlyFreeCash).toBe(0);
  });

  it("computes net worth from all asset types minus liabilities", () => {
    const result = computeMetrics({
      stocks: [{ valueIls: "100000" }],
      options: [{ valueIls: "50000" }],
      savings: [{ balanceIls: "200000" }],
      pension: [{ balanceIls: "300000" }],
      liabilities: [{ balanceIls: "80000" }],
      cashflow: [{ freeCashIls: "10000" }],
    });
    expect(result.netWorthIls).toBe(570000);
    expect(result.liquidAssetsIls).toBe(100000);
    expect(result.illiquidAssetsIls).toBe(500000);
    expect(result.usdExposureIls).toBe(150000);
    expect(result.ilsExposureIls).toBe(500000);
    expect(result.monthlyFreeCash).toBe(10000);
  });

  it("handles multiple rows per category", () => {
    const result = computeMetrics({
      stocks: [{ valueIls: "50000" }, { valueIls: "30000" }],
      options: [],
      savings: [{ balanceIls: "100000" }, { balanceIls: "150000" }],
      pension: [],
      liabilities: [{ balanceIls: "20000" }, { balanceIls: "10000" }],
      cashflow: [],
    });
    expect(result.netWorthIls).toBe(300000);
    expect(result.liquidAssetsIls).toBe(80000);
  });

  it("handles negative option values (underwater)", () => {
    const result = computeMetrics({
      stocks: [],
      options: [{ valueIls: "-5000" }],
      savings: [],
      pension: [],
      liabilities: [],
      cashflow: [],
    });
    expect(result.netWorthIls).toBe(-5000);
    expect(result.usdExposureIls).toBe(-5000);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/computedMetrics.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement computed metrics**

Create `src/lib/computedMetrics.ts`:
```typescript
interface MetricsInput {
  stocks: { valueIls: string }[];
  options: { valueIls: string }[];
  savings: { balanceIls: string }[];
  pension: { balanceIls: string }[];
  liabilities: { balanceIls: string }[];
  cashflow: { freeCashIls: string }[];
}

interface ComputedMetrics {
  netWorthIls: number;
  liquidAssetsIls: number;
  illiquidAssetsIls: number;
  usdExposureIls: number;
  ilsExposureIls: number;
  monthlyFreeCash: number;
}

function sumField<T>(rows: T[], field: keyof T): number {
  return rows.reduce((acc, row) => acc + Number(row[field]), 0);
}

export function computeMetrics(data: MetricsInput): ComputedMetrics {
  const stocksValue = sumField(data.stocks, "valueIls");
  const optionsValue = sumField(data.options, "valueIls");
  const savingsValue = sumField(data.savings, "balanceIls");
  const pensionValue = sumField(data.pension, "balanceIls");
  const liabilitiesValue = sumField(data.liabilities, "balanceIls");
  const freeCash = sumField(data.cashflow, "freeCashIls");

  return {
    netWorthIls: stocksValue + optionsValue + savingsValue + pensionValue - liabilitiesValue,
    liquidAssetsIls: stocksValue,
    illiquidAssetsIls: savingsValue + pensionValue,
    usdExposureIls: stocksValue + optionsValue,
    ilsExposureIls: savingsValue + pensionValue,
    monthlyFreeCash: freeCash,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/computedMetrics.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/computedMetrics.ts src/lib/__tests__/computedMetrics.test.ts vitest.config.ts package*.json
git commit -m "feat: add computed metrics with tests"
```

---

## Chunk 4: API Routes

### Task 9: Snapshots API routes

**Files:**
- Create: `src/app/api/snapshots/route.ts`
- Create: `src/app/api/snapshots/[id]/route.ts`

- [ ] **Step 1: Create POST/GET /api/snapshots**

Create `src/app/api/snapshots/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSnapshot, listSnapshots } from "@/entities/snapshots";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { month, year, notes } = body;

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  try {
    const snapshot = await createSnapshot(month, year, notes);
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Snapshot already exists for this month" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const snapshots = await listSnapshots();
  return NextResponse.json(snapshots);
}
```

- [ ] **Step 2: Create GET /api/snapshots/[id]**

Create `src/app/api/snapshots/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { getStocksForSnapshot } from "@/entities/stocks";
import { getOptionsForSnapshot } from "@/entities/options";
import { getSavingsForSnapshot } from "@/entities/savings";
import { getPensionForSnapshot } from "@/entities/pension";
import { getLiabilitiesForSnapshot } from "@/entities/liabilities";
import { getCashflowForSnapshot } from "@/entities/cashflow";
import { getFxRatesForSnapshot } from "@/entities/fx";
import { computeMetrics } from "@/lib/computedMetrics";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  if (isNaN(snapshotId)) {
    return NextResponse.json({ error: "Invalid snapshot ID" }, { status: 400 });
  }

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const [stockRows, optionRows, savingsRows, pensionRows, liabilityRows, cashflowRows, fxRows] =
    await Promise.all([
      getStocksForSnapshot(snapshotId),
      getOptionsForSnapshot(snapshotId),
      getSavingsForSnapshot(snapshotId),
      getPensionForSnapshot(snapshotId),
      getLiabilitiesForSnapshot(snapshotId),
      getCashflowForSnapshot(snapshotId),
      getFxRatesForSnapshot(snapshotId),
    ]);

  const computed = computeMetrics({
    stocks: stockRows,
    options: optionRows,
    savings: savingsRows,
    pension: pensionRows,
    liabilities: liabilityRows,
    cashflow: cashflowRows,
  });

  return NextResponse.json({
    snapshot,
    stocks: stockRows,
    options: optionRows,
    savings: savingsRows,
    pension: pensionRows,
    liabilities: liabilityRows,
    cashflow: cashflowRows,
    fx_rates: fxRows,
    computed,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/snapshots/
git commit -m "feat: add snapshot API routes (list, create, get full)"
```

---

### Task 10: Sub-resource API routes — fx, stocks, options

**Files:**
- Create: `src/app/api/snapshots/[id]/fx/route.ts`
- Create: `src/app/api/snapshots/[id]/stocks/route.ts`
- Create: `src/app/api/snapshots/[id]/options/route.ts`

- [ ] **Step 1: Create POST /api/snapshots/[id]/fx**

Create `src/app/api/snapshots/[id]/fx/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addFxRate } from "@/entities/fx";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const body = await request.json();
  const { usd_to_ils } = body;

  if (!usd_to_ils || Number(usd_to_ils) <= 0) {
    return NextResponse.json({ error: "usd_to_ils must be a positive number" }, { status: 400 });
  }

  const row = await addFxRate(snapshotId, String(usd_to_ils));
  return NextResponse.json(row, { status: 201 });
}
```

- [ ] **Step 2: Create POST /api/snapshots/[id]/stocks**

Create `src/app/api/snapshots/[id]/stocks/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { getLatestFxRate } from "@/entities/fx";
import { addStocks } from "@/entities/stocks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const fxRate = await getLatestFxRate(snapshotId);
  if (!fxRate) {
    return NextResponse.json(
      { error: "No FX rate found for this snapshot. Add an FX rate first." },
      { status: 422 }
    );
  }

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const rate = Number(fxRate.usdToIls);
  const stockRows = rows.map((r: { ticker: string; quantity: number; price_usd: number }) => ({
    ticker: r.ticker,
    quantity: String(r.quantity),
    priceUsd: String(r.price_usd),
    valueIls: (Number(r.quantity) * Number(r.price_usd) * rate).toFixed(2),
  }));

  const inserted = await addStocks(snapshotId, stockRows);
  return NextResponse.json(inserted, { status: 201 });
}
```

- [ ] **Step 3: Create POST /api/snapshots/[id]/options**

Create `src/app/api/snapshots/[id]/options/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { getLatestFxRate } from "@/entities/fx";
import { addOptions } from "@/entities/options";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const fxRate = await getLatestFxRate(snapshotId);
  if (!fxRate) {
    return NextResponse.json(
      { error: "No FX rate found for this snapshot. Add an FX rate first." },
      { status: 422 }
    );
  }

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const rate = Number(fxRate.usdToIls);
  const optionRows = rows.map((r: {
    label: string;
    quantity: number;
    strike_price_usd: number;
    current_price_usd: number;
    is_vested: boolean;
  }) => ({
    label: r.label,
    quantity: String(r.quantity),
    strikePriceUsd: String(r.strike_price_usd),
    currentPriceUsd: String(r.current_price_usd),
    valueIls: (Number(r.quantity) * (Number(r.current_price_usd) - Number(r.strike_price_usd)) * rate).toFixed(2),
    isVested: r.is_vested,
  }));

  const inserted = await addOptions(snapshotId, optionRows);
  return NextResponse.json(inserted, { status: 201 });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/snapshots/[id]/fx/ src/app/api/snapshots/[id]/stocks/ src/app/api/snapshots/[id]/options/
git commit -m "feat: add API routes for fx, stocks, and options"
```

---

### Task 11: Sub-resource API routes — savings, pension, liabilities, cashflow

**Files:**
- Create: `src/app/api/snapshots/[id]/savings/route.ts`
- Create: `src/app/api/snapshots/[id]/pension/route.ts`
- Create: `src/app/api/snapshots/[id]/liabilities/route.ts`
- Create: `src/app/api/snapshots/[id]/cashflow/route.ts`

- [ ] **Step 1: Create POST /api/snapshots/[id]/savings**

Create `src/app/api/snapshots/[id]/savings/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addSavings } from "@/entities/savings";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const savingsRows = rows.map((r: { account_label: string; balance_ils: number }) => ({
    accountLabel: r.account_label,
    balanceIls: String(r.balance_ils),
  }));

  const inserted = await addSavings(snapshotId, savingsRows);
  return NextResponse.json(inserted, { status: 201 });
}
```

- [ ] **Step 2: Create POST /api/snapshots/[id]/pension**

Create `src/app/api/snapshots/[id]/pension/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addPension } from "@/entities/pension";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const pensionRows = rows.map((r: { provider: string; balance_ils: number }) => ({
    provider: r.provider,
    balanceIls: String(r.balance_ils),
  }));

  const inserted = await addPension(snapshotId, pensionRows);
  return NextResponse.json(inserted, { status: 201 });
}
```

- [ ] **Step 3: Create POST /api/snapshots/[id]/liabilities**

Create `src/app/api/snapshots/[id]/liabilities/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addLiabilities } from "@/entities/liabilities";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const body = await request.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const liabilityRows = rows.map((r: { label: string; balance_ils: number }) => ({
    label: r.label,
    balanceIls: String(r.balance_ils),
  }));

  const inserted = await addLiabilities(snapshotId, liabilityRows);
  return NextResponse.json(inserted, { status: 201 });
}
```

- [ ] **Step 4: Create POST /api/snapshots/[id]/cashflow**

Create `src/app/api/snapshots/[id]/cashflow/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSnapshotById } from "@/entities/snapshots";
import { addCashflow } from "@/entities/cashflow";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshotId = parseInt(id, 10);

  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const body = await request.json();
  const { income_ils, expenses_ils } = body;

  if (income_ils == null || expenses_ils == null) {
    return NextResponse.json({ error: "income_ils and expenses_ils are required" }, { status: 400 });
  }

  if (Number(income_ils) < 0 || Number(expenses_ils) < 0) {
    return NextResponse.json({ error: "Values must be non-negative" }, { status: 400 });
  }

  const row = await addCashflow(snapshotId, String(income_ils), String(expenses_ils));
  return NextResponse.json(row, { status: 201 });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/snapshots/[id]/savings/ src/app/api/snapshots/[id]/pension/ src/app/api/snapshots/[id]/liabilities/ src/app/api/snapshots/[id]/cashflow/
git commit -m "feat: add API routes for savings, pension, liabilities, and cashflow"
```

---

### Task 12: Test all API routes with curl

- [ ] **Step 1: Start Docker Compose**

Run: `docker compose up --build -d`

- [ ] **Step 2: Run migration**

Run: `docker compose exec app npx drizzle-kit push`

- [ ] **Step 3: Test snapshot creation**

Run:
```bash
curl -s -X POST http://127.0.0.1:3000/api/snapshots \
  -H "Content-Type: application/json" \
  -d '{"month": 1, "year": 2025}' | jq .
```
Expected: `201` with snapshot object including `id`.

- [ ] **Step 4: Test FX rate**

Run:
```bash
curl -s -X POST http://127.0.0.1:3000/api/snapshots/1/fx \
  -H "Content-Type: application/json" \
  -d '{"usd_to_ils": 3.72}' | jq .
```
Expected: `201` with fx_rate row.

- [ ] **Step 5: Test stocks (requires FX rate)**

Run:
```bash
curl -s -X POST http://127.0.0.1:3000/api/snapshots/1/stocks \
  -H "Content-Type: application/json" \
  -d '{"rows": [{"ticker": "AAPL", "quantity": 100, "price_usd": 175.50}]}' | jq .
```
Expected: `201` with stock row, `value_ils` computed as `100 * 175.50 * 3.72 = 65286.00`.

- [ ] **Step 6: Test full snapshot retrieval**

Run:
```bash
curl -s http://127.0.0.1:3000/api/snapshots/1 | jq .
```
Expected: Full snapshot with all related rows and computed metrics.

- [ ] **Step 7: Test remaining endpoints**

Test savings, pension, liabilities, cashflow, and options endpoints similarly. Verify all return `201` with correct data.

---

## Chunk 5: Seed Script

### Task 13: Seed script with realistic dummy data

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create seed script**

Create `scripts/seed.ts`:
```typescript
import { db } from "../src/db";
import {
  snapshots, stocks, options, kerenHishtalmut,
  kupatHisachon, liabilities, monthlyCashflow, fxRates,
} from "../src/db/schema";

async function seed() {
  console.log("Seeding database...");

  // Create January 2025 snapshot
  const [snapshot] = await db.insert(snapshots).values({
    snapshotDate: "2025-01-01",
    notes: "First snapshot — baseline",
  }).returning();

  const sid = snapshot.id;

  // FX rate
  await db.insert(fxRates).values({ snapshotId: sid, usdToIls: "3.72" });

  // Stocks
  await db.insert(stocks).values([
    { snapshotId: sid, ticker: "AAPL", quantity: "100", priceUsd: "185.50", valueIls: "69006.00" },
    { snapshotId: sid, ticker: "MSFT", quantity: "50", priceUsd: "390.00", valueIls: "72540.00" },
    { snapshotId: sid, ticker: "GOOGL", quantity: "30", priceUsd: "140.00", valueIls: "15624.00" },
  ]);

  // Options
  await db.insert(options).values([
    {
      snapshotId: sid, label: "Grant A — 2023", quantity: "1000",
      strikePriceUsd: "50.00", currentPriceUsd: "185.50",
      valueIls: "504060.00", isVested: true,
    },
    {
      snapshotId: sid, label: "Grant B — 2024", quantity: "500",
      strikePriceUsd: "120.00", currentPriceUsd: "185.50",
      valueIls: "121830.00", isVested: false,
    },
  ]);

  // Keren Hishtalmut
  await db.insert(kerenHishtalmut).values([
    { snapshotId: sid, accountLabel: "Migdal", balanceIls: "180000.00" },
    { snapshotId: sid, accountLabel: "Harel", balanceIls: "95000.00" },
  ]);

  // Kupat Hisachon
  await db.insert(kupatHisachon).values([
    { snapshotId: sid, provider: "Meitav", balanceIls: "320000.00" },
  ]);

  // Liabilities
  await db.insert(liabilities).values([
    { snapshotId: sid, label: "Car loan", balanceIls: "45000.00" },
    { snapshotId: sid, label: "Personal loan", balanceIls: "20000.00" },
  ]);

  // Cashflow
  await db.insert(monthlyCashflow).values({
    snapshotId: sid, incomeIls: "38000.00", expensesIls: "27000.00", freeCashIls: "11000.00",
  });

  console.log("Seed complete! Snapshot ID:", sid);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add seed script to package.json**

Add to `package.json` scripts:
```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 3: Run seed script**

Run: `npm run seed`
Expected: "Seed complete! Snapshot ID: 1" (or next available ID).

- [ ] **Step 4: Verify seed data**

Run:
```bash
curl -s http://127.0.0.1:3000/api/snapshots/1 | jq .computed
```
Expected: Computed metrics reflecting all seeded data.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts package.json
git commit -m "feat: add seed script with realistic January 2025 dummy data"
```

---

## Chunk 6: Snapshot Entry UI

### Task 14: Root page redirect and layout

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root page to redirect**

Replace `src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/snapshot/new");
}
```

- [ ] **Step 2: Update layout for clean base**

Update `src/app/layout.tsx` to have a clean body with Tailwind defaults — remove the Next.js boilerplate content. Keep the metadata, fonts import, and globals.css import.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: redirect root to snapshot entry page"
```

---

### Task 15: FX Rate section component

**Files:**
- Create: `src/components/snapshot-form/FxRateSection.tsx`

- [ ] **Step 1: Create FxRateSection component**

Create `src/components/snapshot-form/FxRateSection.tsx`:
```tsx
"use client";

interface FxRateSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function FxRateSection({ value, onChange }: FxRateSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">FX Rate</h2>
      <div className="flex items-center gap-3">
        <label htmlFor="fx-rate" className="text-sm text-gray-600">
          USD → ILS
        </label>
        <input
          id="fx-rate"
          type="number"
          step="0.0001"
          min="0"
          placeholder="3.72"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border rounded px-3 py-2 w-32 text-right"
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/snapshot-form/FxRateSection.tsx
git commit -m "feat: add FxRateSection component"
```

---

### Task 16: Stocks section component

**Files:**
- Create: `src/components/snapshot-form/StocksSection.tsx`

- [ ] **Step 1: Create StocksSection component**

Create `src/components/snapshot-form/StocksSection.tsx`:
```tsx
"use client";

export interface StockEntry {
  ticker: string;
  quantity: string;
  priceUsd: string;
}

interface StocksSectionProps {
  rows: StockEntry[];
  fxRate: number;
  onRowsChange: (rows: StockEntry[]) => void;
}

export function StocksSection({ rows, fxRate, onRowsChange }: StocksSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { ticker: "", quantity: "", priceUsd: "" }]);
  };

  const updateRow = (index: number, field: keyof StockEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  const calcValue = (row: StockEntry): string => {
    const qty = Number(row.quantity);
    const price = Number(row.priceUsd);
    if (!qty || !price || !fxRate) return "—";
    return (qty * price * fxRate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Stocks</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Ticker</th>
            <th className="py-2">Quantity</th>
            <th className="py-2">Price (USD)</th>
            <th className="py-2 text-right">Value (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="AAPL"
                  value={row.ticker}
                  onChange={(e) => updateRow(i, "ticker", e.target.value.toUpperCase())}
                  className="border rounded px-2 py-1 w-24"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, "quantity", e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-right"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="175.50"
                  value={row.priceUsd}
                  onChange={(e) => updateRow(i, "priceUsd", e.target.value)}
                  className="border rounded px-2 py-1 w-28 text-right"
                />
              </td>
              <td className="py-1 text-right font-mono">{calcValue(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-blue-600 hover:underline"
      >
        + Add stock
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/snapshot-form/StocksSection.tsx
git commit -m "feat: add StocksSection component with auto-calc"
```

---

### Task 17: Options section component

**Files:**
- Create: `src/components/snapshot-form/OptionsSection.tsx`

- [ ] **Step 1: Create OptionsSection component**

Create `src/components/snapshot-form/OptionsSection.tsx`:
```tsx
"use client";

export interface OptionEntry {
  label: string;
  quantity: string;
  strikePriceUsd: string;
  currentPriceUsd: string;
  isVested: boolean;
}

interface OptionsSectionProps {
  rows: OptionEntry[];
  fxRate: number;
  onRowsChange: (rows: OptionEntry[]) => void;
}

export function OptionsSection({ rows, fxRate, onRowsChange }: OptionsSectionProps) {
  const addRow = () => {
    onRowsChange([
      ...rows,
      { label: "", quantity: "", strikePriceUsd: "", currentPriceUsd: "", isVested: false },
    ]);
  };

  const updateRow = (index: number, field: keyof OptionEntry, value: string | boolean) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  const calcValue = (row: OptionEntry): string => {
    const qty = Number(row.quantity);
    const strike = Number(row.strikePriceUsd);
    const current = Number(row.currentPriceUsd);
    if (!qty || !current || !fxRate) return "—";
    const val = qty * (current - strike) * fxRate;
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Stock Options</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Label</th>
            <th className="py-2">Quantity</th>
            <th className="py-2">Strike (USD)</th>
            <th className="py-2">Current (USD)</th>
            <th className="py-2">Vested</th>
            <th className="py-2 text-right">Value (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Grant A"
                  value={row.label}
                  onChange={(e) => updateRow(i, "label", e.target.value)}
                  className="border rounded px-2 py-1 w-32"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, "quantity", e.target.value)}
                  className="border rounded px-2 py-1 w-20 text-right"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.strikePriceUsd}
                  onChange={(e) => updateRow(i, "strikePriceUsd", e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-right"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.currentPriceUsd}
                  onChange={(e) => updateRow(i, "currentPriceUsd", e.target.value)}
                  className="border rounded px-2 py-1 w-24 text-right"
                />
              </td>
              <td className="py-1 text-center">
                <input
                  type="checkbox"
                  checked={row.isVested}
                  onChange={(e) => updateRow(i, "isVested", e.target.checked)}
                />
              </td>
              <td className="py-1 text-right font-mono">{calcValue(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-blue-600 hover:underline"
      >
        + Add option grant
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/snapshot-form/OptionsSection.tsx
git commit -m "feat: add OptionsSection component with auto-calc"
```

---

### Task 18: Savings, Pension, Liabilities sections

**Files:**
- Create: `src/components/snapshot-form/SavingsSection.tsx`
- Create: `src/components/snapshot-form/PensionSection.tsx`
- Create: `src/components/snapshot-form/LiabilitiesSection.tsx`

- [ ] **Step 1: Create SavingsSection**

Create `src/components/snapshot-form/SavingsSection.tsx`:
```tsx
"use client";

export interface SavingsEntry {
  accountLabel: string;
  balanceIls: string;
}

interface SavingsSectionProps {
  rows: SavingsEntry[];
  onRowsChange: (rows: SavingsEntry[]) => void;
}

export function SavingsSection({ rows, onRowsChange }: SavingsSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { accountLabel: "", balanceIls: "" }]);
  };

  const updateRow = (index: number, field: keyof SavingsEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Keren Hishtalmut</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Account</th>
            <th className="py-2 text-right">Balance (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Migdal"
                  value={row.accountLabel}
                  onChange={(e) => updateRow(i, "accountLabel", e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="150000"
                  value={row.balanceIls}
                  onChange={(e) => updateRow(i, "balanceIls", e.target.value)}
                  className="border rounded px-2 py-1 w-36 text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">
        + Add account
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Create PensionSection**

Create `src/components/snapshot-form/PensionSection.tsx`:
```tsx
"use client";

export interface PensionEntry {
  provider: string;
  balanceIls: string;
}

interface PensionSectionProps {
  rows: PensionEntry[];
  onRowsChange: (rows: PensionEntry[]) => void;
}

export function PensionSection({ rows, onRowsChange }: PensionSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { provider: "", balanceIls: "" }]);
  };

  const updateRow = (index: number, field: keyof PensionEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Kupat Hisachon (Pension)</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Provider</th>
            <th className="py-2 text-right">Balance (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Meitav"
                  value={row.provider}
                  onChange={(e) => updateRow(i, "provider", e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="200000"
                  value={row.balanceIls}
                  onChange={(e) => updateRow(i, "balanceIls", e.target.value)}
                  className="border rounded px-2 py-1 w-36 text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">
        + Add provider
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Create LiabilitiesSection**

Create `src/components/snapshot-form/LiabilitiesSection.tsx`:
```tsx
"use client";

export interface LiabilityEntry {
  label: string;
  balanceIls: string;
}

interface LiabilitiesSectionProps {
  rows: LiabilityEntry[];
  onRowsChange: (rows: LiabilityEntry[]) => void;
}

export function LiabilitiesSection({ rows, onRowsChange }: LiabilitiesSectionProps) {
  const addRow = () => {
    onRowsChange([...rows, { label: "", balanceIls: "" }]);
  };

  const updateRow = (index: number, field: keyof LiabilityEntry, value: string) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onRowsChange(updated);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Liabilities</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Label</th>
            <th className="py-2 text-right">Balance (ILS)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">
                <input
                  type="text"
                  placeholder="Car loan"
                  value={row.label}
                  onChange={(e) => updateRow(i, "label", e.target.value)}
                  className="border rounded px-2 py-1 w-40"
                />
              </td>
              <td className="py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="45000"
                  value={row.balanceIls}
                  onChange={(e) => updateRow(i, "balanceIls", e.target.value)}
                  className="border rounded px-2 py-1 w-36 text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">
        + Add liability
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/snapshot-form/SavingsSection.tsx src/components/snapshot-form/PensionSection.tsx src/components/snapshot-form/LiabilitiesSection.tsx
git commit -m "feat: add Savings, Pension, and Liabilities section components"
```

---

### Task 19: Cashflow section component

**Files:**
- Create: `src/components/snapshot-form/CashflowSection.tsx`

- [ ] **Step 1: Create CashflowSection**

Create `src/components/snapshot-form/CashflowSection.tsx`:
```tsx
"use client";

interface CashflowSectionProps {
  incomeIls: string;
  expensesIls: string;
  onIncomeChange: (value: string) => void;
  onExpensesChange: (value: string) => void;
}

export function CashflowSection({
  incomeIls,
  expensesIls,
  onIncomeChange,
  onExpensesChange,
}: CashflowSectionProps) {
  const freeCash = Number(incomeIls) - Number(expensesIls);
  const freeCashDisplay =
    incomeIls && expensesIls
      ? freeCash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Monthly Cashflow</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Income (ILS)</label>
          <input
            type="number"
            min="0"
            placeholder="35000"
            value={incomeIls}
            onChange={(e) => onIncomeChange(e.target.value)}
            className="border rounded px-3 py-2 w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Expenses (ILS)</label>
          <input
            type="number"
            min="0"
            placeholder="25000"
            value={expensesIls}
            onChange={(e) => onExpensesChange(e.target.value)}
            className="border rounded px-3 py-2 w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Free Cash (ILS)</label>
          <div className="border rounded px-3 py-2 text-right bg-gray-50 font-mono">
            {freeCashDisplay}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/snapshot-form/CashflowSection.tsx
git commit -m "feat: add CashflowSection component with auto-calc"
```

---

### Task 20: Snapshot entry page — assemble the full form

**Files:**
- Create: `src/app/snapshot/new/page.tsx`

- [ ] **Step 1: Create the snapshot entry page**

Create `src/app/snapshot/new/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { FxRateSection } from "@/components/snapshot-form/FxRateSection";
import { StocksSection, StockEntry } from "@/components/snapshot-form/StocksSection";
import { OptionsSection, OptionEntry } from "@/components/snapshot-form/OptionsSection";
import { SavingsSection, SavingsEntry } from "@/components/snapshot-form/SavingsSection";
import { PensionSection, PensionEntry } from "@/components/snapshot-form/PensionSection";
import { LiabilitiesSection, LiabilityEntry } from "@/components/snapshot-form/LiabilitiesSection";
import { CashflowSection } from "@/components/snapshot-form/CashflowSection";

export default function NewSnapshotPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [notes, setNotes] = useState("");
  const [fxRate, setFxRate] = useState("");
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [options, setOptions] = useState<OptionEntry[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [pension, setPension] = useState<PensionEntry[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityEntry[]>([]);
  const [incomeIls, setIncomeIls] = useState("");
  const [expensesIls, setExpensesIls] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ section: string; ok: boolean }[]>([]);

  const fxRateNum = Number(fxRate);

  const handleSave = async () => {
    setSaving(true);
    setStatus([]);
    const results: { section: string; ok: boolean }[] = [];

    try {
      // 1. Create snapshot
      const snapRes = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, notes: notes || undefined }),
      });
      const snap = await snapRes.json();
      if (!snapRes.ok) throw new Error(snap.error || "Failed to create snapshot");
      results.push({ section: "Snapshot", ok: true });
      const snapshotId = snap.id;

      // 2. FX Rate
      if (fxRate) {
        const res = await fetch(`/api/snapshots/${snapshotId}/fx`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usd_to_ils: Number(fxRate) }),
        });
        results.push({ section: "FX Rate", ok: res.ok });
      }

      // 3. Stocks
      const validStocks = stocks.filter((r) => r.ticker && r.quantity && r.priceUsd);
      if (validStocks.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/stocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validStocks.map((r) => ({
              ticker: r.ticker,
              quantity: Number(r.quantity),
              price_usd: Number(r.priceUsd),
            })),
          }),
        });
        results.push({ section: "Stocks", ok: res.ok });
      }

      // 4. Options
      const validOptions = options.filter((r) => r.label && r.quantity);
      if (validOptions.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validOptions.map((r) => ({
              label: r.label,
              quantity: Number(r.quantity),
              strike_price_usd: Number(r.strikePriceUsd),
              current_price_usd: Number(r.currentPriceUsd),
              is_vested: r.isVested,
            })),
          }),
        });
        results.push({ section: "Options", ok: res.ok });
      }

      // 5. Savings
      const validSavings = savings.filter((r) => r.accountLabel && r.balanceIls);
      if (validSavings.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/savings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validSavings.map((r) => ({
              account_label: r.accountLabel,
              balance_ils: Number(r.balanceIls),
            })),
          }),
        });
        results.push({ section: "Savings", ok: res.ok });
      }

      // 6. Pension
      const validPension = pension.filter((r) => r.provider && r.balanceIls);
      if (validPension.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/pension`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validPension.map((r) => ({
              provider: r.provider,
              balance_ils: Number(r.balanceIls),
            })),
          }),
        });
        results.push({ section: "Pension", ok: res.ok });
      }

      // 7. Liabilities
      const validLiabilities = liabilities.filter((r) => r.label && r.balanceIls);
      if (validLiabilities.length > 0) {
        const res = await fetch(`/api/snapshots/${snapshotId}/liabilities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: validLiabilities.map((r) => ({
              label: r.label,
              balance_ils: Number(r.balanceIls),
            })),
          }),
        });
        results.push({ section: "Liabilities", ok: res.ok });
      }

      // 8. Cashflow
      if (incomeIls && expensesIls) {
        const res = await fetch(`/api/snapshots/${snapshotId}/cashflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            income_ils: Number(incomeIls),
            expenses_ils: Number(expensesIls),
          }),
        });
        results.push({ section: "Cashflow", ok: res.ok });
      }
    } catch (err) {
      results.push({ section: "Snapshot", ok: false });
    }

    setStatus(results);
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold">New Monthly Snapshot</h1>

      {/* Month/Year Picker */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Period</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded px-3 py-2 w-24"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. bonus month, stock split"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>
      </section>

      <hr />
      <FxRateSection value={fxRate} onChange={setFxRate} />
      <hr />
      <StocksSection rows={stocks} fxRate={fxRateNum} onRowsChange={setStocks} />
      <hr />
      <OptionsSection rows={options} fxRate={fxRateNum} onRowsChange={setOptions} />
      <hr />
      <SavingsSection rows={savings} onRowsChange={setSavings} />
      <hr />
      <PensionSection rows={pension} onRowsChange={setPension} />
      <hr />
      <LiabilitiesSection rows={liabilities} onRowsChange={setLiabilities} />
      <hr />
      <CashflowSection
        incomeIls={incomeIls}
        expensesIls={expensesIls}
        onIncomeChange={setIncomeIls}
        onExpensesChange={setExpensesIls}
      />
      <hr />

      {/* Summary Bar */}
      <section className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold">Summary</h2>
        {(() => {
          const stocksVal = stocks.reduce((sum, r) => {
            const v = Number(r.quantity) * Number(r.priceUsd) * fxRateNum;
            return sum + (isNaN(v) ? 0 : v);
          }, 0);
          const optionsVal = options.reduce((sum, r) => {
            const v = Number(r.quantity) * (Number(r.currentPriceUsd) - Number(r.strikePriceUsd)) * fxRateNum;
            return sum + (isNaN(v) ? 0 : v);
          }, 0);
          const savingsVal = savings.reduce((sum, r) => sum + (Number(r.balanceIls) || 0), 0);
          const pensionVal = pension.reduce((sum, r) => sum + (Number(r.balanceIls) || 0), 0);
          const liabilitiesVal = liabilities.reduce((sum, r) => sum + (Number(r.balanceIls) || 0), 0);
          const freeCash = (Number(incomeIls) || 0) - (Number(expensesIls) || 0);
          const netWorth = stocksVal + optionsVal + savingsVal + pensionVal - liabilitiesVal;
          const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><span className="text-gray-500">Net Worth:</span> <span className="font-mono font-semibold">{fmt(netWorth)} ILS</span></div>
              <div><span className="text-gray-500">Liquid (Stocks):</span> <span className="font-mono">{fmt(stocksVal)} ILS</span></div>
              <div><span className="text-gray-500">Illiquid:</span> <span className="font-mono">{fmt(savingsVal + pensionVal)} ILS</span></div>
              <div><span className="text-gray-500">USD Exposure:</span> <span className="font-mono">{fmt(stocksVal + optionsVal)} ILS</span></div>
              <div><span className="text-gray-500">ILS Exposure:</span> <span className="font-mono">{fmt(savingsVal + pensionVal)} ILS</span></div>
              <div><span className="text-gray-500">Free Cash:</span> <span className="font-mono">{fmt(freeCash)} ILS</span></div>
            </div>
          );
        })()}
      </section>
      <hr />

      {/* Save */}
      <div className="space-y-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Snapshot"}
        </button>

        {status.length > 0 && (
          <div className="space-y-1">
            {status.map((s, i) => (
              <div key={i} className={`text-sm ${s.ok ? "text-green-600" : "text-red-600"}`}>
                {s.ok ? "OK" : "FAILED"}: {s.section}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `docker compose up --build -d`
Open: `http://127.0.0.1:3000/snapshot/new`
Expected: Full form with all sections, add row buttons, auto-calculated values.

- [ ] **Step 3: Commit**

```bash
git add src/app/snapshot/new/page.tsx
git commit -m "feat: add snapshot entry page with all form sections"
```

---

## Chunk 7: Backup/Restore Scripts

### Task 21: Backup and restore scripts

**Files:**
- Create: `scripts/backup.sh`
- Create: `scripts/restore.sh`

- [ ] **Step 1: Create backup script**

Create `scripts/backup.sh`:
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
FILENAME="glass-${TIMESTAMP}.sql.gz"

CONTAINER=$(docker compose ps -q db)

if [ -z "$CONTAINER" ]; then
  echo "Error: db container is not running. Start it with: docker compose up db -d"
  exit 1
fi

docker compose exec -T db pg_dump -U glass glass | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "Backup saved to backups/${FILENAME}"
```

- [ ] **Step 2: Create restore script**

Create `scripts/restore.sh`:
```bash
#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/restore.sh <backup-file>"
  echo "Example: ./scripts/restore.sh backups/glass-2025-01-15-143000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

CONTAINER=$(docker compose ps -q db)

if [ -z "$CONTAINER" ]; then
  echo "Error: db container is not running. Start it with: docker compose up db -d"
  exit 1
fi

echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U glass -d glass

echo "Restore complete."
```

- [ ] **Step 3: Make scripts executable**

Run:
```bash
chmod +x scripts/backup.sh scripts/restore.sh
```

- [ ] **Step 4: Test backup**

Run: `./scripts/backup.sh`
Expected: "Backup saved to backups/glass-YYYY-MM-DD-HHMMSS.sql.gz"

- [ ] **Step 5: Test restore**

Run: `./scripts/restore.sh backups/glass-*.sql.gz`
Expected: "Restore complete." with no errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/backup.sh scripts/restore.sh
git commit -m "feat: add backup and restore scripts for PostgreSQL"
```

---

### Task 22: Create CLAUDE.md for the project

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md with project conventions**

Create `CLAUDE.md`:
```markdown
# Glass — Financial Mirror

## Quick Start

```bash
cp .env.example .env    # First time only
docker compose up --build -d
npm run seed            # Optional: seed with dummy data
```

App: http://127.0.0.1:3000

## Commands

- `docker compose up --build -d` — start app + database
- `docker compose down` — stop everything
- `npx drizzle-kit generate` — generate migration from schema changes
- `npx drizzle-kit push` — apply schema to database
- `npm run seed` — seed with dummy data
- `npm run test:run` — run tests once
- `npm run test` — run tests in watch mode
- `./scripts/backup.sh` — backup database
- `./scripts/restore.sh <file>` — restore database

## Architecture

- **Entity layer** (`src/entities/`) — all database operations go through here. No direct Drizzle calls from API routes or components.
- **Computed metrics** (`src/lib/computedMetrics.ts`) — single source of truth for derived calculations.
- **API routes** (`src/app/api/`) — thin handlers that validate input and delegate to entities.
- **Schema** (`src/db/schema.ts`) — single file for all Drizzle table definitions.

## Rules

- Max 400 lines per file (warn at 300)
- No duplication of business logic
- No direct DB calls outside `src/entities/`
- All data is append-only — never delete rows
- Tests go in `__tests__/` folders next to source
- Feature branches for new work
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add CLAUDE.md with project conventions"
```

---

### Task 23: Push to GitHub

- [ ] **Step 1: Push main branch**

Run:
```bash
git push -u origin main
```
Expected: All commits pushed to `github.com:shronny/glass.git`.
