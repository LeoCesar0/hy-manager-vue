---
status: resolved
type: bug
severity: medium
found-during: "Improving Relatórios page flow and single-month hiding"
found-in: "src/services/analytics/calculate-report-insights.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
discard-reason:
deferred:
---

# "Maior aumento/redução de gastos" only compares first vs last month

## What was found

The insights cards labeled "Maior aumento de gastos" and "Maior redução de gastos"
claim to surface the biggest spending movements across the selected period, but
the underlying calculation only compares the **first** and **last** month of the
selection, per category. Every month in between is ignored.

Concrete failure: select Jan → Jun. Alimentação has this sequence:

| Jan | Feb | Mar | Apr | May | Jun |
|-----|-----|-----|-----|-----|-----|
| 500 | 500 | 2000 | 500 | 500 | 500 |

The card reports "Sem variação" because Jan = Jun. The 4x spike in March is
invisible to the algorithm. Same issue in reverse for temporary drops, and
endpoint coincidences can mask two categories that both moved a lot mid-period.

## Where

`src/services/analytics/calculate-report-insights.ts:39-70` — the
`if (sorted.length >= 2)` block that picks `sorted[0]` and `sorted[sorted.length - 1]`
and iterates categories only between those two entries.

## Why it matters

The label reads as a scan of the whole window. Users will trust the card to
flag meaningful spending movements, but it silently misses anything that
doesn't show up at the endpoints. For any selection longer than 2 months, the
card is unreliable and can actively mislead (e.g., surfacing "no change" when
there was a huge spike).

## Suggested approach

Replace the first-vs-last logic with a pairwise adjacent scan: for every
consecutive pair of selected months, compute per-category deltas and track the
single largest positive and negative change across all pairs and categories.
Return the "to" month of the winning pair alongside the name/amount so the
card subtitle can pinpoint *when* it happened.

Backwards-compatible for 2-month selections (single pair = same result as
today). Only diverges for 3+ months, which is where the bug lives.

## Resolution

Resolved 2026-04-05. Applied Option A from the discussion.

Changes:
- `src/services/analytics/calculate-report-insights.ts` — replaced the
  `sorted[0]` vs `sorted[last]` loop with a pairwise scan over every adjacent
  pair inside the selection. The winning delta now carries the "to" month key
  alongside name/change/changePercent (new `IInsightChange` type, `monthKey`
  field).
- `src/components/Reports/ReportsInsightsKPIs.vue` — card subtitles now read
  `+R$ X em MM/YYYY` and `−R$ X em MM/YYYY`, pinpointing the month where the
  biggest movement landed. The previous subtitle showed the % change but no
  time reference; concrete month is more actionable and the % was dropped to
  keep the subtitle compact.
- `tests/unit/analytics/calculate-report-insights.test.ts` — 3 new tests via
  test-first workflow:
  1. Middle-spike reproduction (flat endpoints, 4x spike in March) — fails
     under the old logic, passes under the fix.
  2. Middle-drop reproduction.
  3. Winner picked across all adjacent pairs *and* all categories (ensures
     the algorithm isn't biased toward a single pair or category).
- All 14 tests pass, `pnpm ts-check` clean.

Two-month selections behave identically to before (one pair = same comparison),
so no regression for the common "compare this month to last month" case.
