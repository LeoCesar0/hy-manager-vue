---
status: open
type: enhancement
severity: low
found-during: "Follow-up from 2026-04-05 positive-expense split rollout"
found-in: "src/components/Reports/ReportsOverviewCharts.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-11
updated: 2026-04-11
resolved-date:
discard-reason:
deferred:
---

# Add "Incluir investimentos" toggle to overview bar chart

## What was found

The Relatórios page has three visualizations that show the
positive-expense (investment) split, each with its own affordance:

- **Donuts** (`ReportsPeriodDonuts`) — `UiSwitch` "Incluir investimentos"
  in the card header (added 2026-04-05). Default off, so investments
  are hidden by default and users opt in.
- **Breakdown list** (`ReportsItemDrillDown`) — always shows the rows
  with an inline `investimento` badge on each category flagged as
  `isPositiveExpense`.
- **Overview bar chart** (`ReportsOverviewCharts`) — currently always
  shows the investment bar as a third grouped bar per month when any
  month has positive-expense activity. No way to hide it.

The user's request: give the bar chart the same toggle as the donuts so
they can collapse the Investimentos series into the Saídas reais series
(or hide it) when they only want to see real spending vs income.

## Where

- `src/components/Reports/ReportsOverviewCharts.vue` — where the series
  config for the bar chart is assembled
- `src/composables/useReportsAnalytics.ts` — already exposes
  `includePositiveExpensesInDonuts`; a parallel
  `includePositiveExpensesInBars` ref would be the natural place to
  wire this
- `src/services/analytics/calculate-overview-bars.ts` — would either
  need to accept a flag and fold `positiveExpenses` into
  `realExpenses`, or return both segments and let the component decide
- `src/pages/dashboard/relatorios/index.vue` — passes the toggle
  handler to `ReportsOverviewCharts`

## Why it matters

Consistency across visualizations. Users who enable "Incluir
investimentos" on the donut but have no way to do the same on the bar
chart end up with mismatched views of the same data on the same page.
Users who don't track investing see a third bar that clutters the
chart.

This is low priority because the chart is still readable without the
toggle, but the inconsistency is an ergonomic paper cut.

## Suggested approach

1. Add `includePositiveExpensesInBars` ref to `useReportsAnalytics`
   (mirroring `includePositiveExpensesInDonuts`, default `false`).
2. Pipe it into `calculate-overview-bars.ts` via a new option. When
   `false`, fold `positiveExpenses` into `realExpenses` and emit the
   series as a single `expenses` value (matching the pre-split shape).
   When `true`, emit the split as today.
3. In `ReportsOverviewCharts.vue`, conditionally build the series:
   - Toggle off → two series: Entradas, Saídas (combined total)
   - Toggle on → three series: Entradas, Saídas reais, Investimentos
   Guard the Investimentos series as today (omit if no month has
   positive-expense activity even with the toggle on).
4. Render a `UiSwitch` in the card header, labeled "Incluir
   investimentos", to match the donut card copy verbatim.
5. Default off, matching donuts.

Relates to (but is independent of):
`2026-04-11-investigate-grouped-stacked-bar.md`. That one is about
*how* to render the split visually; this one is about *whether* to
render it at all. They can ship independently — the toggle should land
regardless of whether the stacking investigation succeeds, because the
"hide it entirely" affordance works for both the current grouped layout
and any future stacked layout.

Open question to decide during implementation: when the toggle is off,
should the Investimentos value be added into the Saídas reais bar (so
the total expense bar height is preserved) or simply omitted (bar
shrinks)? Probably fold — otherwise a user toggling off would see
balance seem to "improve" without any real change, which is misleading.
