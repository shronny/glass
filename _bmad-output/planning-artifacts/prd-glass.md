---
workflowType: 'prd'
workflow: 'edit'
classification:
  domain: 'personal-finance'
  projectType: 'internal-tool'
  complexity: 'low'
inputDocuments:
  - 'docs/superpowers/specs/2026-03-17-financial-mirror-m1-design.md'
stepsCompleted: ['step-e-01-discovery', 'step-e-01b-legacy-conversion', 'step-e-02-review', 'step-e-03-edit']
lastEdited: '2026-03-31'
editHistory:
  - date: '2026-03-31'
    changes: 'Full BMAD conversion from legacy design spec. Added Executive Summary, Success Criteria, Product Scope, User Journeys, FRs, NFRs. Migrated technical detail to appendix.'
---

# Glass — Financial Mirror PRD

## Executive Summary

Glass is a local-only household financial dashboard for a single user (Ronny). It captures a monthly snapshot of the complete financial picture: stocks, options, savings accounts (keren hishtalmut), pension (kupat hisachon), liabilities, cashflow, and FX rates.

**Core differentiator:** All data is append-only — nothing is ever deleted. Every snapshot is a permanent record. This builds a full historical picture over time with no accidental data loss.

**Target user:** Single household, localhost, no auth required.

**M1 goal:** Deliver a working monthly snapshot entry form backed by a correct, queryable data store.

---

## Success Criteria

All criteria are measurable and testable for M1.

| # | Criterion | Measurement |
|---|-----------|-------------|
| SC-1 | User can submit a complete monthly snapshot in a single form session | Manual test: fill all sections, click Save, confirm all rows persisted |
| SC-2 | Net worth is computed correctly from stored values | Unit test: known inputs → expected net worth output |
| SC-3 | No data is ever deleted or overwritten | DB assertion: row count only grows; no UPDATE/DELETE statements in codebase |
| SC-4 | App starts cleanly from `docker compose up` + `npx drizzle-kit push` + `npm run dev` | Manual test on clean machine |
| SC-5 | Partial save is recoverable — if one section fails, other sections already saved are not lost | Manual test: submit with one invalid section, confirm others persisted |
| SC-6 | FX-dependent values (stocks, options) are computed correctly at insert time | Unit test: known ticker/price/fx inputs → expected ILS value stored |

---

## Product Scope

### M1 — Data Foundation & Snapshot Entry (current)

- Monthly snapshot entry form (single long form)
- All asset/liability categories: stocks, options, keren hishtalmut, kupat hisachon, liabilities, cashflow, FX rate
- Append-only PostgreSQL data store
- Computed metrics at read time (net worth, exposures)
- Docker-based local infrastructure
- Backup/restore scripts

### M2 — Dashboard & History (future)

- Dashboard home screen with net worth over time
- Charts and visualizations (trends, exposures)
- Historical comparison between snapshots
- Mobile-responsive layout

### M3 — Intelligence (future)

- Claude AI financial advisor integration
- Anomaly detection and commentary
- Goal tracking

### Permanently Deferred

- Authentication (single user, localhost only)
- Hebrew/RTL UI
- Multi-user support
- Cloud hosting

---

## User Journeys

### Journey 1: Monthly Snapshot Entry

**Trigger:** First day of the month. Ronny opens the app at `localhost:3000`.

1. App redirects to `/snapshot/new`
2. Ronny selects the month and year (defaults to current month)
3. Ronny enters the USD → ILS FX rate for the month
4. Ronny fills in stock positions — ticker, quantity, price in USD; ILS value auto-calculates
5. Ronny fills in options grants — label, quantity, strike/current price, vested flag; value auto-calculates
6. Ronny enters keren hishtalmut balances (one row per account/provider)
7. Ronny enters kupat hisachon balance (one row per provider)
8. Ronny enters liabilities (one row per loan/debt)
9. Ronny enters monthly income and expenses; free cash auto-calculates
10. Ronny reviews the summary bar (net worth, USD exposure, ILS exposure)
11. Ronny clicks Save — each section is POSTed sequentially
12. Success confirmation shown per section; any failures flagged inline with retry option

**Happy path duration:** ~5 minutes for a typical month.

### Journey 2: Mistake Correction

**Trigger:** Ronny realizes after saving that a stock price was entered incorrectly.

1. Ronny opens `/snapshot/new` for the same month
2. Ronny re-enters the correct stock row
3. Ronny saves — new rows are appended alongside the original incorrect rows
4. Note: M1 has no supersede mechanism. Both rows exist. A correction mechanism is planned for a future milestone.

### Journey 3: Reviewing a Snapshot (API)

**Trigger:** Ronny wants to verify what was recorded for a past month.

1. Ronny calls `GET /api/snapshots` to list all snapshots
2. Ronny calls `GET /api/snapshots/{id}` to retrieve all rows + computed metrics for that month

---

## Functional Requirements

### Snapshot Management

| ID | Requirement |
|----|-------------|
| FR-01 | Users can create a snapshot for a given month/year; duplicate months are rejected |
| FR-02 | Users can list all existing snapshots (id + date) |
| FR-03 | Users can retrieve a full snapshot including all rows and computed metrics |

### Asset Entry

| ID | Requirement |
|----|-------------|
| FR-04 | Users can append stock positions (ticker, quantity, price USD) to a snapshot; ILS value is computed server-side from the snapshot's current FX rate |
| FR-05 | Users can append options grants (label, quantity, strike USD, current USD, vested flag) to a snapshot; ILS value is computed server-side |
| FR-06 | FR-04 and FR-05 return HTTP 422 if no FX rate has been recorded for the snapshot |
| FR-07 | Users can append keren hishtalmut balances (account label, balance ILS) to a snapshot |
| FR-08 | Users can append kupat hisachon balances (provider, balance ILS) to a snapshot |
| FR-09 | Users can append liability records (label, balance ILS) to a snapshot |
| FR-10 | Users can append a cashflow record (income ILS, expenses ILS); free cash is computed server-side |
| FR-11 | Users can append an FX rate (USD → ILS) to a snapshot |

### Computed Metrics

| ID | Requirement |
|----|-------------|
| FR-12 | Net worth = sum(stocks ILS) + sum(options ILS) + sum(keren hishtalmut) + sum(kupat hisachon) − sum(liabilities) |
| FR-13 | Liquid assets = sum(stocks ILS) |
| FR-14 | Illiquid assets = sum(keren hishtalmut) + sum(kupat hisachon) |
| FR-15 | USD exposure = sum(stocks ILS) + sum(options ILS) |
| FR-16 | ILS exposure = sum(keren hishtalmut) + sum(kupat hisachon) |
| FR-17 | Monthly free cash = sum(cashflow free_cash ILS) |
| FR-18 | For snapshots with multiple FX rate rows, only the latest row (by created_at) is used for new ILS calculations |

### Data Integrity

| ID | Requirement |
|----|-------------|
| FR-19 | No row in any table is ever updated or deleted; all writes are INSERT only |
| FR-20 | All numeric fields are non-negative except options ILS value (can be negative if underwater) |
| FR-21 | snapshot_date is unique — no two snapshots can share the same month |

### Snapshot Entry UI

| ID | Requirement |
|----|-------------|
| FR-22 | The entry form displays ILS auto-calculation for stocks and options as the user types, using the FX rate entered in the same session |
| FR-23 | The form displays a summary bar with computed net worth and exposures before submission |
| FR-24 | Save posts each section sequentially; partial saves are acceptable — previously saved sections are not retried |
| FR-25 | The form displays per-section success/error feedback after Save |

---

## Non-Functional Requirements

### Performance

| ID | Requirement |
|----|-------------|
| NFR-01 | API responses for snapshot read (`GET /api/snapshots/[id]`) complete in under 500ms on localhost with up to 5 years of monthly data (60 snapshots) |
| NFR-02 | Snapshot entry form loads in under 2 seconds on localhost |

### Data Integrity & Reliability

| ID | Requirement |
|----|-------------|
| NFR-03 | Database state is durable across container restarts via named Docker volume |
| NFR-04 | The backup script produces a restorable `.sql.gz` file; restore completes without manual SQL editing |
| NFR-05 | Schema migrations are managed by drizzle-kit; no manual SQL required for schema changes |

### Security

| ID | Requirement |
|----|-------------|
| NFR-06 | App binds to 127.0.0.1 only — not accessible from other machines on the network |
| NFR-07 | PostgreSQL is not exposed to the host network — accessible only within the Docker internal network |
| NFR-08 | `.env` (containing credentials) is git-ignored and never committed |
| NFR-09 | Docker containers run as non-root users |

### Code Quality

| ID | Requirement |
|----|-------------|
| NFR-10 | No source file exceeds 400 lines; files approaching 300 lines trigger a review |
| NFR-11 | All database operations go through `src/entities/` — no direct Drizzle calls from API routes or components |
| NFR-12 | Business logic is not duplicated — computed metrics have a single source of truth in `src/lib/computedMetrics.ts` |

---

## Appendix: Technical Reference

### Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS
- **Database:** PostgreSQL 15 (Docker)
- **ORM:** Drizzle ORM with drizzle-kit migrations
- **Runtime:** docker-compose, bound to 127.0.0.1

### Naming Convention

Tables use Hebrew financial product names to match real-world terminology; API/entity/response keys use English aliases:

| Table | API / Entity Alias |
|-------|--------------------|
| keren_hishtalmut | savings |
| kupat_hisachon | pension |

### Data Model Summary

All tables: append-only, indexed on `snapshot_id`.

- **snapshots** — id, snapshot_date (unique), notes, created_at
- **stocks** — id, snapshot_id, ticker, quantity, price_usd, value_ils (computed at insert), created_at
- **options** — id, snapshot_id, label, quantity, strike_price_usd, current_price_usd, value_ils (computed at insert), is_vested, created_at
- **keren_hishtalmut** — id, snapshot_id, account_label, balance_ils, created_at
- **kupat_hisachon** — id, snapshot_id, provider, balance_ils, created_at
- **liabilities** — id, snapshot_id, label, balance_ils, created_at
- **monthly_cashflow** — id, snapshot_id, income_ils, expenses_ils, free_cash_ils (computed at insert), created_at
- **fx_rates** — id, snapshot_id, usd_to_ils, created_at

### Resolution Rules

- **fx_rates:** Latest row by `created_at` used for new ILS calculations and display
- **monthly_cashflow:** All rows summed in computed metrics; UI shows all rows
- **All other tables:** All rows returned and summed; no deduplication

### Architecture Layers

```
src/entities/       ← all DB operations
src/lib/            ← computed metrics (read-time derivations)
src/app/api/        ← thin route handlers (validate → delegate to entities)
src/components/     ← UI components (no direct DB access)
src/db/schema.ts    ← single file for all table definitions
```

### What Is NOT in M1

- Dashboard home screen
- Charts or visualizations
- Claude AI advisor
- Historical comparisons
- Mobile layout
- Hebrew/RTL
- Authentication
- Correction/supersede mechanism for incorrect entries
