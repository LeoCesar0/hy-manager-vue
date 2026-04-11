---
status: resolved
type: bug
severity: medium
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/components/Reports/ReportsOverviewCharts.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-11
resolved-date: 2026-04-11
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

## Resolution

Resolved 2026-04-11 after browser-side diagnostic instrumentation in
both chart components revealed **two distinct bugs** in `BarChart.vue`
and `LineChart.vue`. Both had been latent since the charts were
introduced (commit `c728745`) — the original observation framing that
called it "environmental to Relatórios" was wrong. Dashboard never
consumed these components, so the bug was never compared against a
working reference.

### Bug 1: `BarChart` tooltip handler threw on every hover

**Root cause**: the tooltip trigger handler was typed and written as
`(d: { data: Datum }) => { const item = d.data; ... }`, but unovis's
`GroupedBar` binds each bar element to the raw `Datum` directly, not
wrapped in `{ data: Datum }`. Evidence in
`node_modules/.pnpm/@unovis+ts@1.6.2/node_modules/@unovis/ts/components/grouped-bar/index.js:101-102`:

```js
.selectAll(`.${bar}`)
.data((d) => yAccessors.map(() => d));
```

Each bar's datum is just the parent's `d`. When the handler did
`const item = d.data`, `item` was `undefined`. The next line —
`s.accessor(item)` — threw `TypeError: Cannot read properties of
undefined (reading 'income')`. The tooltip's `render()` was never
called, so nothing appeared. The TypeScript compiler didn't catch the
wrong annotation because the unovis `triggers` callback type is
`any`-typed in the config interface.

**Fix**: changed the handler signature to `(item: Datum)` and used
`item` directly throughout the template builder. One-line rename, five
lines of indirection removed.

### Bug 2: `LineChart` crosshair had no tooltip instance to render into

**Root cause**: `LineChart.vue` declared `<VisCrosshair :template="..." />`
inside the `<VisXYContainer>` but **never added `<VisTooltip />`**. The
crosshair's `_showTooltip` method does this (verified in
`node_modules/.pnpm/@unovis+ts@1.6.2/.../components/crosshair/index.js:213-215`):

```js
const tooltip = config.tooltip ?? this.tooltip;
if (!tooltip || !pos) return;
```

And `XYContainer._setUpComponents` wires `crosshair.tooltip = tooltip`
from the container's tooltip config (same file,
`containers/xy-container/index.js:121`) — but only if a `VisTooltip`
was added to the container. Without one, `crosshair.tooltip` stays
undefined, the early return at `_showTooltip` hits every time, and the
template function is never called. No errors, no warnings, just
silence.

**Fix**: added `<VisTooltip />` as a sibling of `<VisCrosshair>` inside
the `<VisXYContainer>`. The crosshair forces `followCursor = true`
internally (line 219), so no props are needed on the tooltip instance.

### Verification
Both fixes verified by user in browser on `/dashboard/relatorios`
2026-04-11:

- BarChart: hover a bar → tooltip renders with correct month label and
  series values.
- LineChart: hover a line point → crosshair cursor line appears and
  tooltip renders with the monthly values.

### Aftermath
- The 2026-04-05 attempt (wrapping chart output in
  `<div class="relative bar-chart-wrapper">`) is harmless and left in
  place — it was a shot in the dark that didn't matter. Could be
  reverted as cleanup but there's no reason to.
- The cursor override in `BarChart.vue`'s scoped style
  (`rect { cursor: pointer }`) is useful independently and stays.
- All temporary `TODO(diagnostic):` console.log instrumentation was
  removed in the same commit that applied the fix.

### Takeaway for future debugging
When a tooltip handler "doesn't work", attach diagnostic logs inside
the handler body BEFORE speculating about CSS/positioning. In this
case, 15 minutes of browser-side logging identified the root cause
that 2 hours of static analysis missed. The `2026-04-05` attempt
failed exactly because it skipped this step.
