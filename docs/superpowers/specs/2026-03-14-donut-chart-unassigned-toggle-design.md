# Donut Chart Unassigned Data Toggle

## Problem

Dashboard donut charts exclude transactions that have no category (`categoryIds` is empty) or no counterparty (`counterpartyId` is null). Users have no way to see how much of their spending/income is unclassified.

## Solution

Add an uncategorized/unassigned bucket to the grouping functions and a per-chart toggle button in the DonutChart component to show/hide it.

## Changes

### 1. `group-by-category.ts`

- After the `transaction.categoryIds.forEach(...)` loop, check `if (transaction.categoryIds.length === 0)` — the forEach naturally iterates zero times on an empty array, so this explicit check catches unclassified transactions
- Accumulate into a synthetic entry with id `"uncategorized"`, name `"Sem categoria"`, and a neutral gray color (`#9CA3AF`)
- No new parameters needed — always include the bucket in the output

### 2. `group-by-counterparty.ts`

- In the else branch of the existing `if (transaction.counterpartyId)` check, handle the `null` case
- Accumulate into a synthetic entry with id `"no-counterparty"`, name `"Sem terceiro"`, and gray color (`#9CA3AF`)
- No new parameters needed — always include the bucket in the output

Note: Synthetic IDs are safe from Firestore collisions — auto-generated Firestore IDs are always 20 alphanumeric characters, while `"uncategorized"` and `"no-counterparty"` are shorter and contain a hyphen.

### 3. `calculate-insights.ts`

- Filter out synthetic IDs (`"uncategorized"`, `"no-counterparty"`) from the `getTop()` results so insight cards never display "Sem categoria" or "Sem terceiro" as the top item — that would be misleading rather than actionable

### 4. `DonutChart.vue`

**New props:**
- `unassignedId?: string` — the synthetic ID to identify the unassigned slice (e.g. `"uncategorized"` or `"no-counterparty"`)
- `toggleLabel?: string` — label for the toggle tooltip (e.g. `"sem categoria"` or `"sem terceiro"`)

**Internal state:**
- `showUnassigned = ref(false)` — defaults to hidden (current behavior preserved)

**Computed:**
- `hasUnassigned` — whether the data contains an item matching `unassignedId`
- `displayData` — filters out the unassigned item when `showUnassigned` is false

**UI:**
- Small icon button in the card header (right-aligned, next to title), with `aria-label` and `aria-pressed` for accessibility
- Uses `Eye`/`EyeOff` icons from lucide-vue-next
- Only rendered when `unassignedId` is provided AND `hasUnassigned` is true
- Tooltip: "Mostrar {toggleLabel}" / "Ocultar {toggleLabel}"
- All existing chart logic (chartConfig, total, colorAccessor, legend) uses `displayData` instead of raw `data`
- The unassigned entry gets gray color (`#9CA3AF`) regardless of its sort position — DonutChart forces this color when the item ID matches `unassignedId`
- Legend truncation (8 items max) applies as-is; no special treatment for the unassigned entry

### 5. `dashboard/index.vue`

Pass new props to each DonutChart:

| Chart | `unassignedId` | `toggleLabel` |
|-------|-----------------|---------------|
| Saidas por Categoria | `"uncategorized"` | `"sem categoria"` |
| Saidas por Terceiro | `"no-counterparty"` | `"sem terceiro"` |
| Entradas por Categoria | `"uncategorized"` | `"sem categoria"` |
| Entradas por Terceiro | `"no-counterparty"` | `"sem terceiro"` |

## Behavior

- Default: unassigned data hidden (matches current behavior)
- Toggle is per-chart (independent state, resets on page navigation)
- When toggled on, the unassigned slice appears in the donut with neutral gray color, included in total, percentage calculations, and legend
- When toggled off, the slice is filtered out and totals recalculate without it

## Impact

- No backend/Firestore changes
- No report recalculation
- `calculateInsights` filters out synthetic IDs so insight cards remain meaningful
- Purely frontend compute + UI toggle

## Files Modified

1. `src/services/analytics/group-by-category.ts`
2. `src/services/analytics/group-by-counterparty.ts`
3. `src/services/analytics/calculate-insights.ts`
4. `src/components/Dashboard/DonutChart.vue`
5. `src/pages/dashboard/index.vue`
6. `src/composables/useDashboardAnalytics.ts` — reviewed, no changes needed (function signatures unchanged)
