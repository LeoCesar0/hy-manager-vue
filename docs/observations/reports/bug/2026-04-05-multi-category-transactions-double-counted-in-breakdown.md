---
status: open
type: bug
severity: medium
found-during: "Adding positive-expense split to Relatórios analytics"
found-in: "src/services/api/reports/apply-transaction-to-report.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
discard-reason:
deferred:
---

# Multi-category transactions are counted once in totals but once per category in the per-category maps

## What was found

A single transaction with `categoryIds = ["A", "B"]` is counted:

- **Once** in `report.totalExpenses` / `monthEntry.expenses` (the amount is added to the scalar total one time)
- **Once per category** in `report.expensesByCategory` and `monthEntry.expensesByCategory` (the full amount is added to bucket A *and* to bucket B)

So for a R$ 100 transaction tagged with 2 categories, `sum(expensesByCategory) = 200` but `expenses = 100`. The per-category map reports 2× the actual spending.

Same issue applies to `depositsByCategory`. Not applicable to counterparty maps — transactions only have a single `counterpartyId`.

## Where

`src/services/api/reports/apply-transaction-to-report.ts:31-39` (report-level map)
`src/services/api/reports/apply-transaction-to-report.ts:87-95` (monthly entry map)

Both loops iterate `transaction.categoryIds` and add the full `amount * direction` to each category bucket, with no division or de-duplication.

## Why it matters

Everywhere in the app that reads `expensesByCategory` / `depositsByCategory` and sums or compares the values is affected:

- `buildBreakdownList` (Categorias list in Relatórios): categories shared by many transactions are inflated
- `buildCategoryDrillDown` (drill-down totals)
- `aggregatePeriodBreakdowns` (donuts)
- `compareMonths` and `calculateReportInsights.biggestIncrease/Decrease`
- `calculateBudgetProgress`

The severity depends on how often users multi-tag transactions. If it's rare, the visual distortion is small. If users routinely apply both a broad category ("Casa") and a specific one ("Energia") to the same transaction, the inflation can be large.

Also creates a subtle constraint for the positive-expense split (now being added to `calculate-report-insights`): the naive formula `realExpenses = expenses - sum(positiveExpenseBuckets)` can go negative when a transaction has mixed categories, because `sum(positiveExpenseBuckets)` can exceed `expenses`. The current implementation clamps with `Math.max(0, ...)` to stay safe, but that's a symptom — the root is here.

## Suggested approach

Two reasonable fixes:

1. **Divide the amount across categories** — add `amount / categoryIds.length` to each bucket. The maps then sum to `expenses`. Simple, preserves the invariant, loses the "how much did I tag with cat A overall" signal for multi-tag transactions.

2. **Treat categories as a single combined key** (e.g. sorted join) — keeps the full amount per combination but changes the map shape. More invasive.

Option 1 is the standard approach and matches how most personal finance apps handle multi-tag splits. Requires a report rebuild after deploying.

Not fixing in the current task — scope is the positive-expense split in analytics. Flagging so we know where the clamp in `splitPositiveExpenses` comes from, and so this can be prioritized independently.
