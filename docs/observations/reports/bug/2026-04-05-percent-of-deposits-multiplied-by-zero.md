---
status: resolved
type: bug
severity: medium
found-during: "discussion about merging Dashboard and Reports pages"
found-in: "src/composables/useReportsAnalytics.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
discard-reason:
deferred:
---

# `percentOfDeposits` always resolves to 0 in category drill-down

## What was found
In `categoryDrillDown` (inside `useReportsAnalytics`), `percentOfDeposits` is computed by multiplying by `0` instead of `100`, so the value is always `0`. `percentOfExpenses` right above it correctly uses `* 100`.

```ts
const percentOfExpenses = totalAllExpenses > 0 ? (totalExpense / totalAllExpenses) * 100 : 0;
const percentOfDeposits = totalAllDeposits > 0 ? (totalDeposit / totalAllDeposits) * 0 : 0;
//                                                                                    ^ bug
```

## Where
`src/composables/useReportsAnalytics.ts:126`

## Why it matters
Any UI that displays the deposit percentage for a selected category in the drill-down will always show `0%`, silently hiding correct income-side data. This is a logic bug, not just a display glitch — consumers of `categoryDrillDown.percentOfDeposits` get a wrong number.

## Suggested approach
Change `* 0` to `* 100`. If no consumer currently reads `percentOfDeposits`, also verify whether the field is meant to be rendered somewhere (e.g., drill-down component) and wire it up.

## Resolution
Resolved on 2026-04-05. The bug had two parts:

1. **Math bug** — `* 0` was a typo that silently zeroed every deposit percentage.
2. **UI gap** — `ReportsCategoryDrillDown.vue` never rendered `percentOfDeposits` in the deposits card, so even if the math had been correct the value was invisible.

### What was done
- Extracted the inline `categoryDrillDown` logic from `useReportsAnalytics.ts` into a pure function at `src/services/analytics/build-category-drill-down.ts` to make it unit-testable.
- Wrote regression tests at `tests/unit/analytics/build-category-drill-down.test.ts` following the test-first workflow: the deposit-percent test failed against the buggy `* 0` math (expected 75, got 0), then passed after the fix.
- Fixed the math to `* 100`.
- Wired `percentOfDeposits` into the deposits card in `ReportsCategoryDrillDown.vue:101-108` so the value is now visible in the UI (matches the existing expenses card pattern).

### Files touched
- `src/services/analytics/build-category-drill-down.ts` (new)
- `tests/unit/analytics/build-category-drill-down.test.ts` (new — 6 tests, all green)
- `src/composables/useReportsAnalytics.ts` (delegates to the new pure function)
- `src/components/Reports/ReportsCategoryDrillDown.vue` (added deposits percentage display)
