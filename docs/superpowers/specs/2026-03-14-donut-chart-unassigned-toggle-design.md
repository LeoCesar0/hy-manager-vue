# Donut Chart Unassigned Data Toggle

## Problem

Dashboard donut charts exclude transactions that have no category (`categoryIds` is empty) or no counterparty (`counterpartyId` is null). Users have no way to see how much of their spending/income is unclassified.

## Solution

Add an uncategorized/unassigned bucket to the grouping functions and a per-chart toggle button in the DonutChart component to show/hide it.

## Changes

### 1. `group-by-category.ts`

- After iterating `transaction.categoryIds`, check if the array is empty
- If empty, accumulate into a synthetic entry with id `"uncategorized"`, name `"Sem categoria"`, and a neutral gray color (`#9CA3AF`)
- No new parameters needed — always include the bucket in the output

### 2. `group-by-counterparty.ts`

- After checking `transaction.counterpartyId`, handle the `null` case
- Accumulate into a synthetic entry with id `"no-counterparty"`, name `"Sem terceiro"`
- No new parameters needed — always include the bucket in the output

### 3. `DonutChart.vue`

**New props:**
- `unassignedId?: string` — the synthetic ID to identify the unassigned slice (e.g. `"uncategorized"` or `"no-counterparty"`)
- `toggleLabel?: string` — label for the toggle tooltip (e.g. `"sem categoria"` or `"sem terceiro"`)

**Internal state:**
- `showUnassigned = ref(false)` — defaults to hidden (current behavior preserved)

**Computed:**
- `hasUnassigned` — whether the data contains an item matching `unassignedId`
- `displayData` — filters out the unassigned item when `showUnassigned` is false

**UI:**
- Small icon button in the card header (right-aligned, next to title)
- Uses `Eye`/`EyeOff` icons from lucide-vue-next
- Only rendered when `unassignedId` is provided AND `hasUnassigned` is true
- Tooltip: "Mostrar {toggleLabel}" / "Ocultar {toggleLabel}"
- All existing chart logic (chartConfig, total, colorAccessor, legend) uses `displayData` instead of raw `data`

### 4. `dashboard/index.vue`

Pass new props to each DonutChart:

| Chart | `unassignedId` | `toggleLabel` |
|-------|-----------------|---------------|
| Saidas por Categoria | `"uncategorized"` | `"sem categoria"` |
| Saidas por Terceiro | `"no-counterparty"` | `"sem terceiro"` |
| Entradas por Categoria | `"uncategorized"` | `"sem categoria"` |
| Entradas por Terceiro | `"no-counterparty"` | `"sem terceiro"` |

## Behavior

- Default: unassigned data hidden (matches current behavior)
- Toggle is per-chart (independent state)
- When toggled on, the unassigned slice appears in the donut with a neutral gray color, included in total, percentage calculations, and legend
- When toggled off, the slice is filtered out and totals recalculate without it

## Impact

- No backend/Firestore changes
- No report recalculation
- `calculateInsights` is unaffected — it calls the same grouping functions, and the "top" insight will naturally pick up uncategorized if it's the largest bucket, which is acceptable
- Purely frontend compute + UI toggle

## Files Modified

1. `src/services/analytics/group-by-category.ts`
2. `src/services/analytics/group-by-counterparty.ts`
3. `src/components/Dashboard/DonutChart.vue`
4. `src/pages/dashboard/index.vue`
