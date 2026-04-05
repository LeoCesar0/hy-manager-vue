---
status: open
type: enhancement
severity: medium
found-during: "Phase 2 of positive-expense split — propagating real/positive separation across Relatórios"
found-in: "src/components/Reports/ReportsOverviewCharts.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
discard-reason:
deferred:
---

# "Entradas vs Saídas" bar chart counts investments as spending

## What was found

The bar chart in `ReportsOverviewCharts.vue` renders `chartData` (from `overviewChartData` in `useReportsAnalytics`) which uses the raw `entry.expenses` field for each month. Months where the user moved money into positive-expense categories (Investimentos, Poupança) show an inflated "Saídas" bar that conflates real spending with saving.

The InsightsKPIs cards, the "Proporção Saídas/Entradas" line, and the Monthly Comparison table have already been adjusted to split these out. The bar chart is the last large visual on the Relatórios page still showing the conflated number.

## Where

- `src/composables/useReportsAnalytics.ts:77-88` — `overviewChartData` computed, which feeds the bar chart
- `src/components/Reports/ReportsOverviewCharts.vue:8-12` — `ChartDataItem` type (`income`, `expenses`)
- `src/components/Reports/ReportsOverviewCharts.vue:61-66` — `<BarChart>` render

## Why it matters

In a month where the user earned R$ 5k and spent R$ 2k on real expenses plus R$ 1k sent to investments, the current chart renders a R$ 3k "Saídas" bar. That visually suggests the user is saving only R$ 2k/month when the real number is R$ 3k. The whole purpose of the Relatórios page is to give an honest read on the user's financial health — this is a meaningful distortion.

## Suggested approach

**Stacked bar** is the preferred UX (confirmed with user in Phase 2 planning): keep a single "Saídas" column but split it vertically into a real-expense segment (bottom, `--expense` color) and an investment segment (top, muted / distinct color). This preserves the total-outflow signal while also surfacing the saving component.

Implementation steps:

1. Enrich `overviewChartData` to carry `realExpenses` and `positiveExpenses` derived via `splitPositiveExpenses`. Can drop the `expenses` field or keep it for backwards compat depending on other consumers.
2. Check `src/components/Charts/BarChart.vue` — does it support stacked series natively? `@unovis/vue` `VisStackedBar` is the right primitive if not already wired up. May need to accept a `series` prop similar to `LineChart`.
3. Update the tooltip to show all three numbers (entradas, saídas reais, investimentos).
4. Update the legend so users understand what the stacked segment represents.

Unit coverage: `overviewChartData` is currently logic-only inside the composable. If the split logic lives there, consider extracting to a pure function like `calculate-balance-trend.ts` so it can be unit tested the same way.

Alternative considered and rejected: filter investments out entirely (no stacked segment). Rejected because it hides a real outflow — users need to see their total cash movement, not just their "real" spending.
