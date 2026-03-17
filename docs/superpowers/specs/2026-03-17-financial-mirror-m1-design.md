# Financial Mirror — M1 Design Spec

## Overview

Local-only family financial dashboard. Single user (Ronny), runs on localhost. Monthly manual snapshots capture the full household financial picture: stocks, options, savings, pension, liabilities, cashflow, and FX rates. All data is append-only — nothing is ever deleted.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data mutation | Append-only, no deletes | Preserve full history for learning |
| Auth | None | Single user, localhost only |
| UI language | English | Simpler for M1, Hebrew deferred |
| Snapshot entry | Single long form | Fastest to fill monthly, simplest to build |
| ORM | Drizzle | Type-safe, lightweight, proper migrations |
| Database | PostgreSQL 15 in Docker | Local only, no cloud |
| Coding standards | DealOptima conventions | Max 400 LOC/file, entity layer, no duplication |

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS
- **Database:** PostgreSQL 15 (Docker)
- **ORM:** Drizzle ORM with drizzle-kit migrations
- **Runtime:** docker-compose, bound to 127.0.0.1 only

## Project Structure

```
Glass/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.ts
├── drizzle.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Redirect to /snapshot/new
│   │   ├── snapshot/
│   │   │   └── new/
│   │   │       └── page.tsx            # Single-form snapshot entry
│   │   └── api/
│   │       └── snapshots/
│   │           ├── route.ts            # GET list, POST create
│   │           └── [id]/
│   │               ├── route.ts        # GET full snapshot
│   │               ├── stocks/route.ts
│   │               ├── options/route.ts
│   │               ├── savings/route.ts
│   │               ├── pension/route.ts
│   │               ├── liabilities/route.ts
│   │               ├── cashflow/route.ts
│   │               └── fx/route.ts
│   ├── db/
│   │   ├── index.ts                    # Drizzle client init
│   │   ├── schema.ts                   # All table definitions
│   │   └── migrations/                 # Drizzle-generated SQL
│   ├── entities/                       # Data access layer
│   │   ├── snapshots.ts
│   │   ├── stocks.ts
│   │   ├── options.ts
│   │   ├── savings.ts
│   │   ├── pension.ts
│   │   ├── liabilities.ts
│   │   ├── cashflow.ts
│   │   └── fx.ts
│   ├── components/
│   │   └── snapshot-form/
│   │       ├── StocksSection.tsx
│   │       ├── OptionsSection.tsx
│   │       ├── SavingsSection.tsx
│   │       ├── PensionSection.tsx
│   │       ├── LiabilitiesSection.tsx
│   │       ├── CashflowSection.tsx
│   │       └── FxRateSection.tsx
│   ├── lib/
│   │   └── computedMetrics.ts          # Net worth, exposures
│   └── utils/
├── scripts/
│   ├── seed.ts
│   ├── backup.sh
│   └── restore.sh
└── backups/                            # Git-ignored
```

## Data Model

### Naming Convention

Tables use Hebrew financial product names (`keren_hishtalmut`, `kupat_hisachon`) to match real-world terminology. API routes, entities, components, and response keys use English aliases for developer ergonomics:

| Table Name | API Route / Entity / Response Key |
|------------|----------------------------------|
| keren_hishtalmut | savings |
| kupat_hisachon | pension |

### Stored vs Computed Values

- `value_ils` in stocks and options tables is **computed at insert time** using the FX rate provided in the same form submission, and **stored**. This preserves the exact value at time of entry.
- `free_cash_ils` in monthly_cashflow is **computed at insert time** (income - expenses) and **stored**.
- The metrics in `computedMetrics.ts` (net worth, exposures, etc.) are **derived at read time** by summing the stored values. They are never stored.

### Correction Model (M1)

M1 has no correction mechanism. If data is entered incorrectly, the user submits new correct rows. All rows (including mistakes) remain in the database. A correction/supersede mechanism may be added in a future milestone.

### snapshots

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_date | date | First day of month, unique |
| notes | text | Optional context (e.g. "bonus month", "stock split") |
| created_at | timestamptz | Auto-set |

### stocks

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| ticker | text | e.g. AAPL |
| quantity | numeric(18,4) | Number of shares |
| price_usd | numeric(18,4) | Price per share in USD |
| value_ils | numeric(18,2) | Stored at insert: quantity x price x fx_rate |
| created_at | timestamptz | Auto-set |

### options

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| label | text | e.g. "Grant A" |
| quantity | numeric(18,4) | Number of units (vested or unvested, see is_vested) |
| strike_price_usd | numeric(18,4) | |
| current_price_usd | numeric(18,4) | |
| value_ils | numeric(18,2) | Stored at insert: quantity x (current - strike) x fx_rate |
| is_vested | boolean | Whether these units are vested |
| created_at | timestamptz | Auto-set |

### keren_hishtalmut

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| account_label | text | e.g. "Migdal", "Harel" |
| balance_ils | numeric(18,2) | |
| created_at | timestamptz | Auto-set |

### kupat_hisachon

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| provider | text | |
| balance_ils | numeric(18,2) | |
| created_at | timestamptz | Auto-set |

### liabilities

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| label | text | e.g. "Car loan" |
| balance_ils | numeric(18,2) | |
| created_at | timestamptz | Auto-set |

### monthly_cashflow

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| income_ils | numeric(18,2) | |
| expenses_ils | numeric(18,2) | |
| free_cash_ils | numeric(18,2) | Stored at insert: income - expenses |
| created_at | timestamptz | Auto-set |

### fx_rates

| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| snapshot_id | integer | FK → snapshots |
| usd_to_ils | numeric(18,4) | e.g. 3.72 |
| created_at | timestamptz | Auto-set |

All tables have an index on `snapshot_id`. All POST endpoints append rows (never replace or delete).

## Computed Metrics

Derived at read time in `computedMetrics.ts` by summing stored values. Never stored themselves.

| Metric | Formula |
|--------|---------|
| net_worth_ils | sum(stocks.value_ils) + sum(options.value_ils) + sum(keren_hishtalmut.balance_ils) + sum(kupat_hisachon.balance_ils) - sum(liabilities.balance_ils) |
| liquid_assets_ils | sum(stocks.value_ils) |
| illiquid_assets_ils | sum(keren_hishtalmut.balance_ils) + sum(kupat_hisachon.balance_ils) |
| usd_exposure_ils | sum(stocks.value_ils) + sum(options.value_ils) |
| ils_exposure_ils | sum(keren_hishtalmut.balance_ils) + sum(kupat_hisachon.balance_ils) |
| monthly_free_cash | sum(monthly_cashflow.free_cash_ils) |

### Resolution Rules for Single-Value Tables

For tables that logically have one value per snapshot (fx_rates, monthly_cashflow) but may have multiple rows due to append-only semantics:
- **fx_rates:** The latest row (by `created_at`) is used for display and for computing `value_ils` on new inserts.
- **monthly_cashflow:** All rows are summed in computed metrics. The UI shows all rows.
- **All other tables:** All rows are returned and summed. No deduplication.

## API Routes

All routes return JSON. No authentication.

| Method | Route | Behavior |
|--------|-------|----------|
| POST | /api/snapshots | Create snapshot (month/year) |
| GET | /api/snapshots | List all snapshots (id + date) |
| GET | /api/snapshots/[id] | Full snapshot with all rows + computed metrics |
| POST | /api/snapshots/[id]/stocks | Append stock rows |
| POST | /api/snapshots/[id]/options | Append option rows |
| POST | /api/snapshots/[id]/savings | Append keren hishtalmut rows |
| POST | /api/snapshots/[id]/pension | Append kupat hisachon rows |
| POST | /api/snapshots/[id]/liabilities | Append liability rows |
| POST | /api/snapshots/[id]/cashflow | Append cashflow row |
| POST | /api/snapshots/[id]/fx | Append fx rate row |

### Request Body Shapes

**POST /api/snapshots**
```json
{ "month": 3, "year": 2026, "notes": "optional context" }
```

**POST /api/snapshots/[id]/stocks**
```json
{ "rows": [{ "ticker": "AAPL", "quantity": 100, "price_usd": 175.50 }] }
```
`value_ils` is computed server-side using the latest fx_rate for the snapshot. Returns 422 if no fx_rate exists for this snapshot.

**POST /api/snapshots/[id]/options**
```json
{ "rows": [{ "label": "Grant A", "quantity": 500, "strike_price_usd": 50, "current_price_usd": 175, "is_vested": true }] }
```

**POST /api/snapshots/[id]/savings**
```json
{ "rows": [{ "account_label": "Migdal", "balance_ils": 150000 }] }
```

**POST /api/snapshots/[id]/pension**
```json
{ "rows": [{ "provider": "Meitav", "balance_ils": 200000 }] }
```

**POST /api/snapshots/[id]/liabilities**
```json
{ "rows": [{ "label": "Car loan", "balance_ils": 45000 }] }
```

**POST /api/snapshots/[id]/cashflow**
```json
{ "income_ils": 35000, "expenses_ils": 25000 }
```
`free_cash_ils` is computed server-side.

**POST /api/snapshots/[id]/fx**
```json
{ "usd_to_ils": 3.72 }
```

All numeric fields are required and must be non-negative (except `value_ils` for options which can be negative if underwater).

### GET /api/snapshots/[id] Response Shape

```json
{
  "snapshot": { "id": 1, "snapshot_date": "2025-01-01" },
  "stocks": [],
  "options": [],
  "savings": [],
  "pension": [],
  "liabilities": [],
  "cashflow": [],
  "fx_rates": [],
  "computed": {
    "net_worth_ils": 0,
    "liquid_assets_ils": 0,
    "illiquid_assets_ils": 0,
    "usd_exposure_ils": 0,
    "ils_exposure_ils": 0,
    "monthly_free_cash": 0
  }
}
```

## Snapshot Entry UI

Single page at `/snapshot/new`. One long scrollable form:

1. **Month/Year picker** — defaults to current month
2. **FX Rate** — single input: USD → ILS
3. **Stocks** — dynamic table: Ticker, Quantity, Price (USD), Value (ILS) auto-calc. Add row button.
4. **Options** — dynamic table: Label, Quantity, Strike (USD), Current (USD), Vested checkbox, Value (ILS) auto-calc. Add row button.
5. **Savings** — dynamic table: Account Label, Balance (ILS). Add row button.
6. **Pension** — dynamic table: Provider, Balance (ILS). Add row button.
7. **Liabilities** — dynamic table: Label, Balance (ILS). Add row button.
8. **Cashflow** — Income (ILS), Expenses (ILS), Free Cash auto-calc.
9. **Summary bar** — computed net worth and exposures
10. **Save button** — POSTs each section sequentially, shows success/error per section. Partial saves are acceptable — if one section fails, the user can fix and retry that section. No transaction wrapping across sections.

FX rate must be entered before stocks/options sections can compute ILS values.

Styling: Tailwind CSS, clean functional forms. No design system for M1.

## Docker & Infrastructure

### docker-compose.yml

- `app`: Next.js, `127.0.0.1:3000`
- `db`: PostgreSQL 15, no host port exposed, internal network only
- Named volume: `glass-db-data`
- Both containers run as non-root
- Env loaded from `.env`

### .env.example

```
POSTGRES_USER=glass
POSTGRES_PASSWORD=change_me
POSTGRES_DB=glass
DATABASE_URL=postgresql://glass:change_me@db:5432/glass
```

### Backup/Restore

- `scripts/backup.sh` — pg_dump via Docker exec → `./backups/YYYY-MM-DD-HHMMSS.sql.gz`
- `scripts/restore.sh [filename]` — restore via Docker exec
- No host PostgreSQL required

### .gitignore

```
.env
backups/
node_modules/
.next/
```

## Security

- App binds to 127.0.0.1 only
- PostgreSQL not exposed to host network
- .env in .gitignore
- Containers run as non-root
- No secrets in code

## What Is NOT in M1

- Dashboard home screen (M2)
- Charts or visualizations (M2)
- Claude AI advisor (M3)
- Historical comparisons (M2)
- Mobile layout (M2)
- Hebrew/RTL (deferred)
- Authentication (not needed — single user, localhost)
