---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success']
classification:
  projectType: 'web_app'
  domain: 'fintech'
  complexity: 'medium-high'
  projectContext: 'greenfield'
inputDocuments:
  - 'docs/superpowers/specs/2026-03-17-financial-mirror-m1-design.md'
  - 'docs/superpowers/plans/2026-03-17-financial-mirror-m1.md'
  - '_bmad-output/planning-artifacts/prd-glass.md'
workflowType: 'prd'
---

# Product Requirements Document - Glass

**Author:** Ronnysh
**Date:** 2026-04-01

## Executive Summary

Glass is a household financial audit and wealth intelligence platform. It ingests financial institution documents (PDFs, screenshots) and market data to construct a complete, historically accurate picture of household wealth across all asset classes. The core premise: financial institutions report performance in isolation — Glass cross-references those reports against real market data to surface discrepancies, gaps, and opportunities the user would otherwise miss.

**Target users:** A single household (two members). All data is scoped to the household unit from day one.

**The problem being solved:** Household wealth is fragmented across multiple institutions, each reporting on their own terms, on their own schedule. There is no single place that tells you — with evidence — whether your pension fund actually tracked its benchmark, whether your total wealth grew or shrank relative to the market, or when you have the financial capacity to pay down your mortgage.

### What Makes This Special

- **Adaptive institution onboarding:** Glass learns each institution's document format during onboarding and applies that knowledge to future uploads — no fixed parsers, no manual mapping per document.
- **Two-stream historical reconstruction:** Stock and index performance is fetched automatically via API going back years. Institution documents (pension, keren hishtalmut, savings) fill in the rest. Combined, Glass reconstructs a complete wealth history from day one.
- **Discrepancy detection:** If a fund claims to track the S&P 500 and the index gained 10% while the fund gained 6%, Glass surfaces that gap explicitly — not buried in a statement footnote.
- **Backfill as a first-class feature:** Upload historical documents and Glass reconstructs the past. The historical picture grows richer over time as more documents are added.
- **Audit trail integrity:** Every data point traces back to its source document. Glass is a challenger to what institutions report — that credibility requires immutable, source-linked data.

## Project Classification

- **Project type:** Web application
- **Domain:** Personal finance / household wealth management
- **Complexity:** Medium-high (document extraction pipeline, multi-source data reconciliation, market data integration)
- **Project context:** Greenfield — complete rebuild from prior codebase
- **Stack:** Supabase (database + auth), client-side Next.js app

## Success Criteria

### User Success

| # | Criterion | Measurement |
|---|-----------|-------------|
| US-1 | User can see total household net worth (assets minus mortgage) at a glance | Single ₪ figure, correct to within manual verification |
| US-2 | User can see total gain/loss for the current year | Year-to-date P&L in absolute ₪ terms |
| US-3 | User can see breakdown by owner — Ronny, wife, joint | All assets owner-tagged; summary splits correctly; never requires manual correction after setup |
| US-4 | After each monthly session, user can answer three questions without digging: "How much am I worth? How did I do this month? Is anything wrong?" | All three answerable from the main dashboard |
| US-5 | Full picture — no asset class unaccounted for | Stocks, pension, keren hishtalmut, savings, mortgage all present |
| US-6 | Discrepancy between fund performance and benchmark surfaced proactively | At least one fund vs index comparison visible per monthly session |
| US-7 | At least one financial decision is made using Glass data in the first year | User can point to a decision Glass informed |

### Business Success

| # | Criterion |
|---|-----------|
| BS-1 | Ronny uses Glass every month without friction for 6 consecutive months |
| BS-2 | Glass replaces any existing spreadsheet or manual tracking within 3 months of backfill |

### Technical Success

| # | Criterion |
|---|-----------|
| TS-1 | At least 2 institutions successfully onboarded via PDF extraction at ≥95% accuracy |
| TS-2 | All data points traceable to source document or API call |
| TS-3 | Backfill handles 20+ historical documents in a single session — each correctly assigned to period and institution, with clear per-document status |
| TS-4 | No data is ever overwritten — all writes are append-only or versioned |

### UX Success

| # | Criterion |
|---|-----------|
| UX-1 | Product feels like a premium financial tool — authoritative, precise, trustworthy — not a consumer fintech app |

---

## Product Scope

### MVP — Foundation & First Picture

- Household asset model with owner tagging (Ronny / wife / joint)
- PDF upload + institution onboarding (learn the format, extract data) — primary input method
- Manual entry as fallback per institution only
- Stock price history via API — auto-fetch historical values
- Bulk backfill: upload 20+ historical documents, Glass assigns period and institution
- Net worth dashboard: total now + year P&L + owner breakdown
- Discrepancy view: fund performance vs index benchmark
- Premium financial product aesthetic

### Growth Features (Post-MVP)

- Full adaptive extraction for all 4-7 household institutions (auto-processed monthly)
- Quarterly and semi-annual report handling
- Liquidity intelligence: when to pay down mortgage vs hold assets
- Trend charts — net worth over time, asset allocation shifts

### Vision (Future)

- Predictive scenarios: "if market drops 20%, your net worth looks like X"
- Tax efficiency insights
- Multi-household or advisor mode
