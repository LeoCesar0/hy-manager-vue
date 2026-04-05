---
status: open
type: enhancement
severity: medium
found-during: "Phase 2 of positive-expense split — propagating real/positive separation across Relatórios"
found-in: "src/components/Reports/ReportsPeriodBreakdowns.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
discard-reason:
deferred:
---

# Distribuição donuts mix positive-expense categories with real spending

## What was found

The "Distribuição por Categoria" / "Distribuição por Terceiro" donuts (in the period breakdowns section of Relatórios) render every expense bucket including positive-expense categories. A category like "Investimentos" shows up as a slice of the "onde seu dinheiro foi" donut, competing visually with real spending categories.

This distorts the core question the donut is supposed to answer — "what's the shape of my spending?" — because investing is saving, not spending.

## Where

- `src/services/analytics/aggregate-period-breakdowns.ts` — aggregation logic that feeds the donuts
- `src/components/Reports/ReportsPeriodBreakdowns.vue` (or the file that actually renders the donuts — confirm path when picking up the task)
- `src/composables/useReportsAnalytics.ts:128-143` — `periodBreakdowns` computed

## Why it matters

On users with active investment routines, the "Investimentos" slice can dominate the expense donut, making the chart useless for understanding discretionary spending shape. It also creates a false equivalence between a R$ 500 grocery expense and a R$ 500 investment transfer — visually they look like the same kind of outflow.

## Suggested approach

**Toggle "Mostrar investimentos"** (confirmed with user in Phase 2 planning). Default state: off (exclude positive-expense slices). The toggle lets power users see the full breakdown when they want to audit total outflows, but the default view answers the more common question cleanly.

Implementation notes:

1. Add a boolean state local to the donuts component (or promote to the parent if other siblings need it).
2. The filtering can happen either in `aggregatePeriodBreakdowns` (pass a `categories` prop and an `includePositiveExpense` flag) or at the render layer (filter the slices before passing to the donut). Filtering in the analytics function is cleaner because it also lets the total/percentages recompute correctly.
3. Important: percentages must re-normalize against the **visible** total, not the full total. If we show 3 slices summing to R$ 900 out of a R$ 1000 full pot, the 3 slices should read as 33% each, not 30% each with an invisible 10% missing.
4. Label the toggle so users understand what they're toggling — something like "Incluir investimentos" with a short tooltip.

Alternative considered and rejected: always filter out investments with no toggle. Rejected because some users legitimately want the full breakdown — hiding data silently is worse than hiding it with an affordance to reveal.

Alternative considered and rejected: always show all slices with a visual marker (badge / pattern fill) on positive-expense slices. Rejected because the slice still visually competes for attention and doesn't fix the percentage-distortion problem.
