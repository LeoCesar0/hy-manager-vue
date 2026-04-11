---
status: resolved
type: enhancement
severity: low
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/components/Transactions/FilterPanel.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
discard-reason:
deferred:
---

# Date range filters require manual start+end picking with no quick presets

## What was found

The `FilterPanel` component (used by the transactions list and any other page that adopts it) exposes `startDate` and `endDate` as two independent `DatePicker` fields. To filter by a common period like "February 2026" or "Last 30 days" the user has to open both pickers and navigate to the right day twice.

No preset shortcuts exist for common ranges (this month, last month, named month, last 7/30/90 days, year-to-date, etc.).

## Where

- `src/components/Transactions/FilterPanel.vue:10-17` — `IFilters` type carrying `startDate`/`endDate` as `Timestamp | null`
- `src/components/Transactions/FilterPanel.vue:43-45` — `updateFilter` handler
- Any other consumer of date range inputs — the Relatórios month selector already has its own preset flow (`handleSelectPreset`, `handleSelectYear` in `useReportsAnalytics.ts`), but transactions and other list filters don't share that affordance

## Why it matters

Date range filtering is one of the most frequent operations in a finance app. The current UX requires 4+ clicks/taps just to look at one specific month. On mobile this friction compounds — two calendar popovers to hit the right day each time. A "February" shortcut cuts that to 2 clicks.

## Suggested approach

Add a **preset row** above the two date pickers with chips/buttons:

- "Este mês", "Mês passado", "Últimos 30 dias", "Últimos 90 dias", "Este ano", "Personalizado"
- For named-month navigation, a compact month-picker that lists the last 12 months ("Fev/26", "Jan/26", …) — matches the mental model of "I want to see a specific month"
- "Personalizado" reveals the two `DatePicker` fields for the edge case

Implementation notes:

1. The shortcut buttons should emit `startDate`/`endDate` updates together (single `update:modelValue` call) so the parent doesn't see two partial states.
2. There's existing logic in `useReportsAnalytics.ts` (`getDefaultMonths`, `handleSelectPreset`, `handleSelectYear`) that can be generalized into a shared helper and reused here — avoids duplicating the preset→range conversion.
3. Keep the two manual pickers as an escape hatch under "Personalizado" so power users who need odd ranges (e.g., "15/03 to 15/04") still have them.
4. Consider extracting the preset UI into its own component (`Form/Field/DateRangePreset.vue` or similar) since other list screens will probably want the same affordance.

This applies to: transactions list, and any future list screen with date filters. Not applicable to Relatórios which already has its own preset flow.

## Resolution

Resolved 2026-04-05.

**New helper** `src/helpers/dateRangePresets.ts`: pure module exporting
`DATE_RANGE_PRESETS` — an array of `{ key, label, getRange }` entries
with presets for "Este mês", "Mês passado", "Últimos 7 dias", "Últimos
30 dias", "Últimos 90 dias", "Este ano", and "Personalizado".
`getRange` returns Firestore `Timestamp` pairs directly (start-of-day
to end-of-day, inclusive on both ends) since the FilterPanel consumes
Timestamps. "Personalizado" returns `null` to signal "leave current
range untouched". Kept the helper separate from
`useReportsAnalytics`'s month-based presets because the two use cases
have different shapes (day-range vs month-list).

**FilterPanel** (`src/components/Transactions/FilterPanel.vue`): added
a "Período" row of `UiButton` chips above the existing manual pickers.
Active preset is tracked via `activePresetKey` ref — null initially so
existing filter state isn't clobbered on mount. Clicking a preset emits
a single `update:modelValue` with both `startDate` and `endDate` set
together, avoiding partial state updates the parent has to reconcile.
Manual picker changes automatically deselect the active preset (set it
to `"custom"`) so the UI honestly reflects which mode is driving the
range. `handleClear` also resets `activePresetKey` to null.

Did not extract a separate `DateRangePreset.vue` component — the preset
row is simple enough to inline in `FilterPanel` and only one consumer
exists today. Extract when a second consumer appears.
