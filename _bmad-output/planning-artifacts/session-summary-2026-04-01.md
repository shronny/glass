# Session Summary — 2026-04-01

## What We Did

Ran `/bmad-create-prd` to build a new PRD for Glass from scratch after a full product pivot.

## The Pivot

Glass was a personal localhost financial tracker (M1 mostly built). We scrapped everything and pivoted to a **household financial audit and wealth intelligence platform**.

**All existing code is to be removed.** The old codebase is no longer relevant.

## New Product: Glass

### What it is
A household financial audit platform. Upload PDF/screenshot statements from financial institutions, auto-extract data, cross-reference against real market data, and surface discrepancies between what your funds report vs what the market actually did. Full picture of household wealth with historical P&L.

### Users
Single household — Ronny + wife. All assets scoped as: Ronny / wife / joint.

### Stack
- **Supabase** (database + auth) — replacing local PostgreSQL
- **Next.js** App Router — client-side web app
- **Chrome desktop only** — no mobile, no cross-browser

### Asset Types
- Stocks / ETFs
- Pension (kupat hisachon)
- Keren hishtalmut
- Other savings
- Liabilities: mortgage only (no real estate asset for now)
- Cashflow: Excel upload monthly (income/expenses with categories)

### Data Input Methods
1. PDF / screenshot upload from financial institutions (4-7 per month)
2. Manual entry fallback
3. Excel upload for cashflow (income/expenses)
4. Stock/index prices auto-fetched via API (twice daily)

### Key Features
- **Adaptive institution onboarding** — Glass learns each institution's PDF format
- **Backfill as first-class feature** — upload 20+ historical docs in bulk
- **Discrepancy detection** — fund performance vs index benchmark, flagged on dashboard
- **Net worth dashboard** — month-focused default, period picker available
- **Detail page per asset type** — one page each for stocks, pension, keren hishtalmut, savings, liabilities, cashflow
- **Audit trail** — all data traceable to source document or API call, append-only

## Design Philosophy
> Glass is a mirror, not an analytics tool.
- No complexity. No charts you don't need. Just the numbers.
- If it requires explanation, it's too complex.
- Fewer features done perfectly beats more features done adequately.
- Clarity and control, not insight generation.
- Friction is failure.

## App Structure

**Dashboard (default: current month):**
- Total net worth
- Year P&L (month vs last month, switchable via period picker)
- Owner breakdown (Ronny / wife / joint)
- Cashflow summary (income vs expenses)
- Attention flags (e.g. discrepancy detected)

**Detail pages:**
- Stocks, Pension, Keren Hishtalmut, Savings, Liabilities, Cashflow

## Scope

### MVP
- Auth (household login)
- Asset model with owner tagging
- PDF/screenshot upload + institution onboarding
- Manual entry fallback
- Excel cashflow upload
- Stock API (twice-daily)
- Bulk backfill
- Dashboard + detail pages
- Discrepancy detection

### Growth (Post-MVP)
- Auto-processing for all 4-7 institutions
- Quarterly/semi-annual report handling
- Liquidity intelligence
- Single net worth trend line

### Vision
- Predictive scenarios ("if market drops 20%...")
- Multi-household / advisor mode

## PRD Status

File: `_bmad-output/planning-artifacts/prd.md`

Steps completed:
- ✅ step-01-init
- ✅ step-02-discovery
- ✅ step-02b-vision
- ✅ step-02c-executive-summary
- ✅ step-03-success
- ✅ step-04-journeys
- ✅ step-05-domain (skipped — personal use, no compliance)
- ✅ step-06-innovation
- ✅ step-07-project-type
- ✅ step-08-scoping
- ⏳ step-09-functional ← **NEXT STEP**
- ⏳ step-10-nonfunctional
- ⏳ step-11-polish
- ⏳ step-12-complete

## To Continue

Run `/bmad-create-prd` — it will auto-detect the in-progress PRD and resume from **Step 9: Functional Requirements**.
