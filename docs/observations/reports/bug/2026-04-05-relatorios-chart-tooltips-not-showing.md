---
status: open
type: bug
severity: medium
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/components/Reports/ReportsOverviewCharts.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-11
resolved-date:
discard-reason:
deferred:
---

# Chart tooltips not rendering inside Relatórios

## What was found

The bar and line charts on the Relatórios page (`/dashboard/relatorios`) do not show tooltips on hover. The same chart components render tooltips correctly on the main Dashboard page.

Since both pages consume the same `BarChart.vue` / `LineChart.vue` primitives from `src/components/Charts/` — and both already wire `VisTooltip` / `VisCrosshair` internally — the bug is almost certainly **environmental** to the Relatórios page, not a missing feature inside the chart component.

## Where

- `src/components/Charts/BarChart.vue:104` — `<VisTooltip :triggers="tooltipTriggers" :followCursor="true" />`
- `src/components/Charts/LineChart.vue` — uses `VisTooltip` + `VisCrosshair` with a `tooltipTemplate` function
- `src/components/Reports/ReportsOverviewCharts.vue` — where they're rendered on the broken page
- `src/pages/dashboard/relatorios/index.vue` — parent page wrapper (likely culprit)
- `src/pages/dashboard/index.vue` — reference implementation (works)

## Why it matters

Tooltips are the primary way users read exact values on charts with multiple months. Without them the charts become purely decorative — the user can see the shape but not the numbers. On the Relatórios page specifically, where the whole point is analytical drill-down, this is a meaningful UX regression.

## Suggested approach

The most likely causes, in order of probability:

1. **Overflow clipping**: a parent container (`<UiCard>`, `overflow-x-auto` on the table wrapper, grid cell) has `overflow: hidden` or `overflow-x-auto` that clips the absolutely-positioned tooltip element. `@unovis/vue` renders tooltips as children of the chart's container by default, so if that container has clipping, the tooltip disappears.
2. **z-index**: Relatórios has more stacked UI (budget cards, sticky filters) than Dashboard — the tooltip may be behind a sibling.
3. **Pointer-events**: a sibling element with `pointer-events: auto` on top of the chart swallowing the hover.

Debug path:
1. Open Relatórios in dev tools, hover a chart, inspect whether the tooltip node is rendered in the DOM (even if invisible).
2. If it's there but hidden → walk up the ancestors looking for `overflow: hidden`, then remove/adjust on the specific wrapper.
3. If it's not in the DOM at all → the hover trigger isn't firing; check for overlapping elements with dev tools' pointer events inspector.

Quick fix likely lives in `ReportsOverviewCharts.vue` or its parent card wrapper in `relatorios/index.vue`.

## Previous attempt (2026-04-05) — did not fix

Attempted fix at the chart primitive level in `BarChart.vue` and
`LineChart.vue`:

- Wrapped the chart render output in a `<div class="relative ...">` to
  establish a local positioning context for the unovis tooltip portal.
  Hypothesis was that `VisTooltip` was positioning against an ancestor
  with its own stacking context or overflow boundary, clipping the
  tooltip or pushing it outside the visible area.
- Added a scoped CSS rule in `BarChart.vue`
  (`.bar-chart-wrapper :deep([data-vis-xy-container]) rect { cursor: pointer }`)
  so bars feel interactive.

The attempt was based on static analysis only and was not verified in a
live browser. On manual verification 2026-04-11 the tooltips still do
not appear on `/dashboard/relatorios`, so the wrapper/position-context
hypothesis was wrong (or insufficient). Cursor change and wrapper are
harmless and left in place.

## Next investigation

Reopened 2026-04-11. The positioning-context hypothesis is ruled out.
Next steps:

1. Open `/dashboard/relatorios` in dev tools and hover a bar / line
   point. Determine which of the three scenarios applies:
   - **Tooltip node not in the DOM at all** → hover event isn't firing.
     Check whether an overlay element (UiCard, absolutely-positioned
     filter, grid cell) is catching the pointer events. Inspect with
     the pointer-events inspector.
   - **Tooltip node in the DOM but `display: none` / `opacity: 0`** →
     unovis is computing it but something in the library's trigger
     binding failed. Check console for unovis warnings.
   - **Tooltip node in the DOM and visible, but offscreen** → still a
     positioning issue, but not the one the 2026-04-05 fix addressed.
     Check `transform` / `left` / `top` on the tooltip element.
2. Cross-reference with any other page that uses `BarChart`/`LineChart`
   to confirm whether it's truly Relatórios-specific or affects every
   consumer. Dashboard only has `DonutChart`, so it's not a reference.
3. If the Relatórios page is the only consumer, check `relatorios/index.vue`
   for recently added wrappers (sticky filters, toggles, budget cards)
   that could be catching pointer events or creating a new stacking
   context over the chart area.
