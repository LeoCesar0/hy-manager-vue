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

# Investigate true grouped-stacked bar for overview chart

## What was found

The 2026-04-05 resolution of
`2026-04-05-bar-chart-stacked-positive-expenses.md` shipped the
positive-expense split as three **side-by-side grouped bars** per month
(Entradas, Saídas reais, Investimentos) instead of the originally
intended "two bars per month, with the expense bar split into
real + investment stacked segments". The reason given was that
`@unovis/vue`'s `VisGroupedBar` doesn't natively compose with
`VisStackedBar`, and rolling a custom layered rendering was deemed
disproportionate scope at the time.

This observation is the placeholder to revisit that trade-off.

## Where

- `src/components/Reports/ReportsOverviewCharts.vue` — where the series
  config for the bar chart is built today
- `src/components/Charts/BarChart.vue` — generic bar primitive currently
  configured via `series: BarSeriesConfig[]`
- `src/services/analytics/calculate-overview-bars.ts` — data shape
  `{ income, realExpenses, positiveExpenses, balance }` already
  separates the segments the stacked rendering would need

## Why it matters

The grouped rendering works but isn't the ideal visual: when a user
wants to compare "total outflow by month" against "total inflow by
month", the three-bar layout forces them to mentally re-add the two
expense bars. A stacked expense bar would be visually closer to the
classical income-vs-expense comparison users expect from a monthly
overview.

This is a polish-level enhancement, not blocking. The current grouped
layout is functional and honest.

## Suggested approach

Investigation path (before committing to any implementation):

1. **Check unovis upstream**: look at the `@unovis/vue` / `@unovis/ts`
   repo issues and docs for any recent progress on composing
   `VisGroupedBar` with `VisStackedBar`. If there's a new component or
   API since the last check, that's the cheapest path.
2. **Check unovis examples repo**: some of their demos wire up grouped
   bar charts with per-group stacked rendering by using raw `d3` on top
   of the container. If an official example exists, estimate porting it.
3. **Evaluate D3-direct fallback**: `BarChart.vue` already uses unovis
   containers. Assess whether we can add a custom layer (`g` element)
   rendered with a small d3 stack generator fed by
   `calculate-overview-bars.ts` output, positioned to align with the
   existing x-axis scale. Estimate effort vs. visual payoff.
4. **Alternative simpler visual**: if the above are all disproportionate,
   consider a compromise — two bars per month (Entradas, Saídas *total*)
   with a thin overlay or hatched pattern on the expense bar indicating
   the investment portion. Less accurate than a true stack but cheaper
   than d3-direct.

Decide which option makes sense based on the findings. Do not start
implementation until the investigation is documented inline in this
file.

Relates to (but is independent of):
`2026-04-11-bar-chart-investment-toggle.md` — which adds a toggle that
makes the investment segment optional. That toggle should land
regardless of whether this investigation leads to a real stack, because
users who don't care about the split should be able to hide it entirely.
