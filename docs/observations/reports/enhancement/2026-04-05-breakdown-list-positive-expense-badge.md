---
status: resolved
type: enhancement
severity: low
found-during: "Phase 2 of positive-expense split — propagating real/positive separation across Relatórios"
found-in: "src/components/Reports/ReportsBreakdownDetail.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
discard-reason:
deferred:
---

# Breakdown category list gives no visual cue for positive-expense categories

## What was found

The "Detalhamento → Categorias" list (top-N categories by expense amount) in Relatórios renders positive-expense categories (Investimentos, Poupança) interleaved with real spending categories with no visual distinction. A user glancing at the list can't tell that "Investimentos R$ 1200" is fundamentally different from "Alimentação R$ 1200" — both look like expense rows.

## Where

- `src/services/analytics/build-breakdown-list.ts` — the function that produces the list items
- `src/components/Reports/ReportsBreakdownDetail.vue` (or whichever component renders the categoryList — confirm path when picking up)
- `src/composables/useReportsAnalytics.ts:197-209` — `categoryList` computed

## Why it matters

Lower severity than the bar chart and donuts because the list already shows the category name, which informed users can interpret. But it's still a subtle UX gap — the list is meant to answer "where did my money go?" and a mixed list trains users to lump saving and spending in the same mental bucket.

## Suggested approach

**Visual badge on positive-expense rows** (confirmed with user in Phase 2 planning). Keep the row in place (don't filter it out — unlike the donuts, the list is an information dump and missing rows would be confusing), but add an affordance that marks it as different.

Options:

1. Small pill/badge next to the name: "investimento" in a muted color, similar to how tags are rendered elsewhere in the app.
2. Distinct icon color or a small secondary icon (e.g. `PiggyBank`) next to the category icon.
3. Both — badge + icon styling — for strongest signal.

Minimal viable: just add the badge (option 1). Takes 5 lines of template + a conditional.

Implementation:

1. Ensure `buildBreakdownList` carries the `isPositiveExpense` flag from the category lookup into each list item (likely already does via the category reference — verify).
2. In the list render, conditionally render a `<UiBadge variant="secondary">` or similar next to items where `isPositiveExpense === true`.
3. Consider whether the sort order should change — should positive-expense categories be bucketed at the bottom, or left interleaved? Interleaved matches "top N by outflow" which is the current semantic. Bucketing would require either two separate lists or a visual divider.

Paired with the donut toggle observation: same underlying issue (positive-expense categories being visually indistinguishable), different component, different UX solution because the constraints differ (list = informational, donut = proportional).

## Resolution

Resolved 2026-04-05.

`IBreakdownListItem` gained an optional `isPositiveExpense?: boolean`
field, populated from the `lookup` match. Picked Option 1 from the
Suggested approach: widened the generic constraint on `lookup` to
`{ id; name; color?; isPositiveExpense? }` so both categories and
counterparties satisfy it (counterparties simply never set the flag).
`useReportsAnalytics` call sites are unchanged — `categories.value`
already carries the field.

`ReportsItemDrillDown.vue` conditionally renders a muted
`<UiBadge variant="secondary">investimento</UiBadge>` next to the
category name in each list row when `isPositiveExpense === true`.
Counterparty tab never shows it because counterparties don't carry the
flag. Row is still shown — unlike donuts which filter it — because the
list is informational and a missing row would be more confusing than a
labeled one.

Unit test adjusted: `tests/unit/analytics/build-breakdown-list.test.ts`
"labels unknown IDs as 'Desconhecido'" now asserts the
`isPositiveExpense: false` field in the returned item shape.
