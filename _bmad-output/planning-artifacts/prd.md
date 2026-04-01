---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping']
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

## Design Philosophy

Glass is a mirror, not an analytics tool.

- **No complexity.** No charts you don't need. Just the numbers.
- **If it requires explanation, it's too complex.** Every screen must be immediately obvious to a non-technical user.
- **Fewer features done perfectly beats more features done adequately.** When in doubt, cut.
- **Clarity and control, not insight generation.** Glass tells you what is, not what might be.
- **Friction is failure.** Any step that feels like work is a bug.

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

## User Journeys

### Journey 1: Monthly Review Session

**Trigger:** Start of month — new statements available from institutions.

1. Ronny logs in to Glass
2. Uploads batch of PDFs (4-7 institution statements) in one session
3. Glass processes documents in background — extracts and reconciles data
4. Dashboard updates automatically with full household picture
5. Ronny reviews: net worth, year P&L, owner breakdown, any discrepancies flagged
6. If a file is missing — Glass shows the gap clearly; Ronny fills it in manually
7. Session complete — Ronny knows his financial position

**Success:** All three control questions answered in one session. No hunting for data.

### Journey 2: Backfill Session

**Trigger:** First time using Glass, or adding historical data for older periods.

1. Ronny uploads historical PDFs in bulk (20+ documents across multiple years/institutions)
2. Glass processes each document, assigns it to the correct period and institution
3. Ronny manually enters data for periods where no document exists
4. Historical dashboard materializes — Glass shows wealth history from earliest available data
5. Ronny sees his complete financial picture for the first time

**Success:** Complete historical picture visible. No period left blank without a clear reason.

### Journey 3: Discrepancy Drill-Down

**Trigger:** Glass flags that a fund underperformed its benchmark.

1. Dashboard surfaces discrepancy — e.g. "Harel fund: +6% vs S&P +10% this quarter"
2. Ronny clicks to drill in
3. Glass shows side-by-side: fund reported performance vs index actual performance, period by period
4. Ronny sees the full gap history — is this a one-off or a pattern?
5. Ronny decides whether to act (switch funds, ask institution, hold)

**Success:** Ronny can see the gap, understand if it's a pattern, and make an informed decision.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — deliver the minimum that gives Ronny full financial control in one session.

**Core constraint:** PDF extraction is the riskiest technical piece and the biggest differentiator. MVP must prove extraction works for at least 2 institutions before anything else matters.

**Resource:** Solo developer (Ronny building for himself).

### Application Structure

**Dashboard (default view — month-focused):**
- Total net worth
- Year P&L (current month vs last month, switchable to YTD or custom period via period picker)
- Owner breakdown (Ronny / wife / joint)
- Cashflow summary (income vs expenses this month)
- Simple attention flags (e.g. discrepancy detected) — tap to drill in

**Detail pages (one per asset type):**
- Stocks
- Pension (kupat hisachon)
- Savings (keren hishtalmut)
- Other savings
- Liabilities (mortgage)
- Cashflow (income/expenses by category, Excel upload)

**Data-first philosophy:** The data model is the product. Correct, complete data enables any future view. UI stays minimal now — new views are added as needed without changing the foundation.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** Monthly review session, Backfill session

**Must-Have Capabilities:**
- Supabase auth (household login)
- Household asset model with owner tagging (Ronny / wife / joint)
- PDF + screenshot upload with institution onboarding flow
- Manual entry fallback for any asset type
- Excel upload for monthly cashflow (income/expenses with categories)
- Stock price history via API (twice-daily refresh)
- Bulk backfill: 20+ documents, auto-assigned to period and institution
- Month-focused dashboard with period picker
- Detail page per asset type
- Discrepancy view on pension/fund detail pages; flagged on dashboard
- Premium financial aesthetic — clean, authoritative, Chrome desktop

**Not in MVP:**
- Cashflow backfill (starts from first Excel upload)
- Drill-down history charts
- Liquidity intelligence
- Quarterly/semi-annual report auto-detection

### Post-MVP Features

**Phase 2 (Growth):**
- Full adaptive extraction for all 4-7 institutions (auto-processed monthly)
- Quarterly and semi-annual report handling
- Liquidity intelligence: when to pay down mortgage vs hold
- Single net worth trend line

**Phase 3 (Vision):**
- Predictive scenarios ("if market drops 20%...")
- Multi-household or advisor mode

### Risk Mitigation Strategy

| Risk | Mitigation |
|------|------------|
| PDF extraction fails for an institution | Manual entry fallback; MVP requires only 2 institutions working |
| Scope creep during build | Design Philosophy section is the filter — if it's not in MVP list, it waits |
| Stock API reliability | Cache last values; flag stale data; free tier limits handled gracefully |
| Data correctness | Append-only model + source traceability — bad data is always correctable |
| Cashflow gaps (no historical Excel) | Cashflow starts from first upload; asset history covers the gaps |

## Web App Specific Requirements

### Project-Type Overview

Glass is a desktop-only web application, Chrome-targeted, private (no SEO), with no real-time requirements. Stock data refreshes twice daily on a schedule. Simplicity of implementation matches the simplicity of the product.

### Technical Architecture Considerations

| Concern | Decision |
|---------|----------|
| Rendering | Next.js App Router — SSR for initial load, client-side for interactions |
| Browser support | Chrome only — no cross-browser overhead |
| Mobile | Not supported — desktop layout only |
| Real-time | No WebSockets — stock data fetched twice daily via scheduled job |
| SEO | None — private authenticated app |
| Accessibility | Basic — single household user |
| Auth | Supabase Auth — email/password, household-scoped |

### Performance Targets

| Target | Requirement |
|--------|-------------|
| Dashboard load | Under 2 seconds on desktop Chrome |
| PDF upload response | Immediate acknowledgment; processing runs in background |
| Stock data freshness | Updated twice daily; stale data clearly flagged |
| API response | Under 500ms for all read operations |

### Responsive Design

Desktop-only. Minimum viewport: 1280px. No responsive breakpoints required for MVP.

### Implementation Considerations

- No PWA, no service workers, no offline mode
- No push notifications — user checks Glass on their own schedule
- File upload: support PDF and image (screenshot) formats
- Background processing: async job queue for PDF extraction (Supabase Edge Functions or similar)

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Adaptive Institution Onboarding**
Glass doesn't ship with hardcoded parsers for specific institutions. Instead, it learns each institution's document format during onboarding and stores that knowledge as a reusable template. As institutions change formats or new institutions are added, Glass adapts. This is fundamentally different from existing tools that require manual CSV exports or proprietary bank integrations.

**2. Two-Stream Historical Reconstruction**
Glass combines two independent data streams — auto-fetched stock/index API history (complete, going back years) and manually uploaded institution documents (pension, savings, funds) — to reconstruct a unified wealth history that neither stream could produce alone. The result: a complete financial timeline that materializes from existing data, not future inputs.

**3. Discrepancy Detection as a Core Feature**
Most financial dashboards aggregate and display data. Glass adds a layer of adversarial analysis — it cross-references what your institution reports against what the market actually did and surfaces the gap explicitly. This positions Glass as a financial auditor, not just a tracker.

**4. Backfill as Activation**
The product's value isn't realized gradually over months — it materializes the moment historical documents are uploaded. The backfill session is the product launch moment: years of financial history appear at once, turning Glass from a future tracker into an immediate historical record.

### Market Context & Competitive Landscape

Existing solutions (Mint, Personal Capital, Israeli equivalents) rely on bank API integrations — they track going forward, don't handle Israeli pension/savings products well, and never challenge institution-reported performance. Glass fills a gap: household-level financial audit with document intelligence, benchmarking, and historical reconstruction — without requiring institutional API access.

### Validation Approach

- **Adaptive extraction validated** when 2+ institutions are successfully onboarded at ≥95% accuracy
- **Discrepancy detection validated** when at least one real fund vs index gap is surfaced from actual uploaded data
- **Historical reconstruction validated** when backfill session produces a complete multi-year wealth timeline

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PDF extraction fails for an institution | Manual entry fallback; extraction improves over time as format is learned |
| Institution changes PDF format | Re-onboarding flow; previous extractions remain valid |
| Market data API unavailable | Cache last-known values; flag stale data clearly |
| Extracted data contains errors | Immutable audit trail — all data traceable to source; correction by appending, not overwriting |
