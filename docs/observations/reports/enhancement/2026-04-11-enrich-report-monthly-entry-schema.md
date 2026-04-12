---
status: resolved
type: enhancement
severity: medium
found-during: "discussing positive-expense filter for counterparty donut + forward-looking schema review"
found-in: "src/@schemas/models/report.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-11
updated: 2026-04-11
resolved-date: 2026-04-11
discard-reason:
deferred:
---

# Enrich `IMonthlyEntry` schema with cross-refs and counts

## What was found

The `2026-04-11-bar-chart-investment-toggle` work landed the
"separar investimentos" toggle on the bar chart, and the parallel
"incluir investimentos" toggle on `ReportsPeriodDonuts` already
existed. While reviewing the donut toggle, a gap surfaced:

**The toggle only filters `Saídas por Categoria`. `Saídas por
Identificador` is unaffected**, even when the user toggles
investments off. From a user perspective this is inconsistent —
toggling investments off should hide investment activity from both
expense donuts.

The root cause is structural, not a bug in any single function. The
report's monthly aggregates are **lossy by design**:

```ts
// src/@schemas/models/report.ts
const zMonthlyEntry = z.object({
  income: z.number(),
  expenses: z.number(),
  expensesByCategory: z.record(z.string(), z.number()).default({}),
  depositsByCategory: z.record(z.string(), z.number()).default({}),
  expensesByCounterparty: z.record(z.string(), z.number()).default({}),
  depositsByCounterparty: z.record(z.string(), z.number()).default({}),
});
```

`expensesByCategory` carries category IDs, so the aggregator can
filter against `category.isPositiveExpense`. `expensesByCounterparty`
carries counterparty IDs only — there is **no link** back to the
categories that contributed each amount. Once a transaction is
collapsed into a per-counterparty sum, we cannot recover "how much
of this came from positive-expense categories" without re-walking
the raw transactions.

This observation proposes enriching `zMonthlyEntry` (and the root
`zReportBase` aggregates) in a single forward-looking pass that:

1. Solves the immediate counterparty filter need.
2. Pre-computes additional dimensions that several near-future
   features will need.
3. Migrates once, via the existing **Recalcular** flow, instead of
   serializing N small migrations over time.

## Where

Files affected by the migration (concrete list, not exhaustive
discovery — every consumer of `IMonthlyEntry` should be reviewed):

**Schema and builder (must change):**
- `src/@schemas/models/report.ts` — add new optional fields with
  `.default({})` to keep old docs parseable
- `src/services/api/reports/apply-transaction-to-report.ts` — accept
  a `positiveExpenseCategoryIds: Set<string>` (or full
  `categories: ICategory[]`) so the builder can populate the
  cross-ref and count maps in the same loop it already uses for
  `expensesByCategory` / `expensesByCounterparty`
- `src/services/api/reports/rebuild-report.ts` — load categories and
  pass them through to `applyTransactionToReport`
- `src/services/api/reports/create-empty-report.ts` — initialise the
  new fields to `{}` so freshly created reports have the right shape
- `src/services/api/reports/save-report.ts` — pass-through, may
  need a serialisation review if it strips defaults

**Sync paths (must be audited — they touch the same maps):**
- `src/services/api/sync/cascade-delete-counterparty.ts` — when a
  counterparty is removed, the new cross-ref entries that reference
  it must be cleaned up
- `src/services/api/sync/cascade-delete-category.ts` (if exists) —
  same for categories
- `src/services/api/sync/remove-counterparty-from-report.ts` — same
- `src/services/api/sync/cascade-update-counterparty-category-ids.ts`
  — when a counterparty's auto-categorisation changes, the cross-ref
  may need a rebuild rather than a delta
- Any other `cascade-*` / `remove-*` files that touch the report
  (grep `monthlyBreakdown`)

**Aggregators / consumers (will use the new fields, optionally):**
- `src/services/analytics/aggregate-period-breakdowns.ts` — gains
  the counterparty filter when toggle is off (the immediate motivator)
- `src/services/analytics/build-counterparty-drill-down.ts` — could
  surface "by category" inside a counterparty drill-down using the
  cross-ref map
- `src/services/analytics/build-category-drill-down.ts` — could
  surface "by counterparty" inside a category drill-down
- `src/services/analytics/calculate-report-insights.ts` — can use
  counts to generate frequency-based insights ("you went to Mercado
  47 times this month")
- `src/services/analytics/calculate-budget-progress.ts` — could
  power per-counterparty budget caps in the future (Objetivos
  feature)

**Tests (must update to assert the new shape):**
- `tests/unit/reports/apply-transaction-to-report.test.ts`
- `tests/unit/reports/apply-transaction-monthly-enrichment.test.ts`
- `tests/unit/analytics/aggregate-period-breakdowns.test.ts`
- `tests/unit/sync/cascade-delete-*.test.ts` (every sync test that
  touches `monthlyBreakdown`)
- `tests/unit/schemas/report-schema-enrichment.test.ts`
- `tests/helpers/factories.ts` — update factory defaults

## Why it matters

### Immediate need

The toggle inconsistency between donuts is a real UX paper cut.
Users who track investment categories (Tesouro Direto, CDB,
Poupança, etc.) and see them filtered out of the category donut but
still showing in the counterparty donut will reasonably read that as
broken.

### Future features unlocked (the actual reason to bundle now)

Each enrichment below has at least one concrete near-term consumer
in the codebase or in the in-flight obs queue:

1. **Cross-ref map** unlocks intersection drill-downs:
   - "Mostre Mercado por contraparte" — which establishments
     concentrate the spending in this category? (no current
     surface, but the existing drill-downs are crying for this)
   - "Mostre Pão de Açúcar por categoria" — what do I usually buy
     there? (ditto)
   - The Objetivos feature (`docs/observations/budgets/.../*`)
     could grow per-counterparty caps without another schema
     migration once this exists.
   - Auto-categorisation (`resolveAutoCategoryId`) could use the
     cross-ref to learn "this counterparty usually maps to category
     X with Y% confidence" instead of a hard-coded keyword map.

2. **Counts** unlock frequency-based insights:
   - "Você foi ao Mercado 47 vezes este mês" — the
     `ReportsInsightsKPIs` panel is a natural home.
   - "Ticket médio do Pão de Açúcar: R$120" — derivable as
     `amount / count` without storing average.
   - Per-counterparty Objetivos like "máximo de 4 idas no
     restaurante por mês" require counts.
   - Outlier detection ("você gastou 3× o normal no Mercado este
     mês") becomes possible without re-walking transactions.

3. **Per-month transaction count** unlocks per-period KPIs that
   today silently use the root `transactionCount` (which spans the
   entire report, not the selected period).

### Migration cost is fixed

The migration mechanic is the same regardless of whether we add
1 field or 6: schema gains optional fields with `.default(...)`,
the builder is updated, and the user clicks **Recalcular** once
(the button already exists at `pages/dashboard/relatorios/index.vue`).
Bundling spreads that one-time cost across all the additions
instead of paying it 3-4 times over the next quarters.

### Cross-account reports (deferred) is unaffected

The deferred obs `2026-04-11-global-vs-per-account-scope.md`
sketches a future cross-account reports surface. That feature would
**aggregate** multiple per-account reports rather than replace
them, so the per-account schema enrichments here are orthogonal —
the eventual cross-account aggregator can sum the new fields for
free. No coupling, no need to wait.

## Suggested approach

### Schema diff (additive only)

```ts
// src/@schemas/models/report.ts
const zMonthlyEntry = z.object({
  income: z.number(),
  expenses: z.number(),
  // NEW: per-month transaction count (the root has one for the
  // whole report; this enables per-period KPIs).
  transactionCount: z.number().default(0),

  // unchanged
  expensesByCategory: z.record(z.string(), z.number()).default({}),
  depositsByCategory: z.record(z.string(), z.number()).default({}),
  expensesByCounterparty: z.record(z.string(), z.number()).default({}),
  depositsByCounterparty: z.record(z.string(), z.number()).default({}),

  // NEW: 2D cross-reference maps. Outer key is the category id so
  // the most common access pattern ("iterate positive-expense
  // categories, sum the contraparte slices") is direct.
  expensesByCategoryAndCounterparty: z
    .record(z.string(), z.record(z.string(), z.number()))
    .default({}),
  depositsByCategoryAndCounterparty: z
    .record(z.string(), z.record(z.string(), z.number()))
    .default({}),

  // NEW: per-dimension transaction counts. Enables frequency-based
  // insights and per-counterparty Objetivos.
  expensesByCategoryCount: z.record(z.string(), z.number()).default({}),
  depositsByCategoryCount: z.record(z.string(), z.number()).default({}),
  expensesByCounterpartyCount: z.record(z.string(), z.number()).default({}),
  depositsByCounterpartyCount: z.record(z.string(), z.number()).default({}),
});
```

The root `zReportBase` keeps its existing top-level aggregates
unchanged. We do **not** mirror the new fields at the root for now
— consumers that need cross-period totals can sum across
`monthlyBreakdown`. If a real use case appears we can add them
later in another rebuild.

### Builder change

`apply-transaction-to-report.ts` gains a new prop and a few extra
increments inside its existing transaction loop:

```ts
type IProps = {
  report: IReportBase;
  transaction: ITransaction;
  direction: 1 | -1;
  // NEW: needed so the builder can decide whether a transaction's
  // category contributes to "positive expense" tracking and so
  // cross-ref entries can be tagged.
  positiveExpenseCategoryIds: Set<string>;
};
```

For each transaction with a `counterpartyId`:
- For every `categoryId` in `transaction.categoryIds`, increment
  `expensesByCategoryAndCounterparty[categoryId][counterpartyId]`
  (or the deposits version).
- Increment the corresponding counts.

When `direction = -1` (delete), decrement and prune zero entries
the same way the existing 1D maps are handled.

### Aggregator change

`aggregate-period-breakdowns.ts` reads the new cross-ref map to
filter the counterparty donut when `includePositiveExpenseCategories`
is `false`:

```ts
// pseudo:
for (const cpId of Object.keys(expenseCounterpartyTotals)) {
  if (positiveExpenseIds === null) continue; // toggle on, no filter
  // Sum the positive slice of this counterparty across the period
  let positivePortion = 0;
  for (const positiveCatId of positiveExpenseIds) {
    positivePortion += entry.expensesByCategoryAndCounterparty[positiveCatId]?.[cpId] ?? 0;
  }
  // Subtract; remove if it goes to zero.
  const filtered = expenseCounterpartyTotals.get(cpId)! - positivePortion;
  if (filtered <= 0) expenseCounterpartyTotals.delete(cpId);
  else expenseCounterpartyTotals.set(cpId, filtered);
}
```

The 1D `expensesByCounterparty` map remains the source of truth
for "real total outflow per counterparty"; the cross-ref is the
delta we subtract when filtering.

### Migration

1. Ship the schema + builder + aggregator changes together.
2. On next page load, old reports parse cleanly because every new
   field is `.default(...)`. The cross-ref map being empty means
   the counterparty filter silently no-ops — the donut shows the
   same totals as before until the user runs **Recalcular**.
3. The user clicks **Recalcular** in `pages/dashboard/relatorios/index.vue`
   once per bank account. The full rebuild populates the new
   fields from raw transactions.
4. After rebuild, the toggle behaves consistently across both
   donuts.

Optional follow-up (separate observation): consider auto-rebuilding
the report on first read after a schema version bump, to spare the
user from finding the Recalcular button. Keep the manual button
either way as a recovery tool.

### Multi-category caveat (carry-over from existing design)

A transaction with `categoryIds: ["mercado", "lazer"]` and
counterparty `pao-de-acucar` will increment **both**
`[mercado][pao-de-acucar]` and `[lazer][pao-de-acucar]` by the
full amount. This is consistent with the existing 1D
`expensesByCategory` design, which the obs
`2026-04-05-multi-category-transactions-double-counted-in-breakdown`
discarded as intentional ("user prefers full amount per category").

Implication for the counterparty filter: if a transaction has
**both** a positive-expense category and a regular category, the
positive portion subtracted from the counterparty total will equal
the **full transaction amount**, not the rateio. So the
counterparty disappears entirely from the filtered donut even if
half of it was "real" spending.

This is over-filtering for a niche edge case (multi-category
transactions where one is positive). It's the most conservative
interpretation and matches the user's existing preference for
"full amount per category". A more sophisticated rateio is
documented in the alternatives below for future reconsideration.

### What was explicitly ruled out (and why)

| Idea | Verdict | Reason |
|---|---|---|
| Single-field shortcut: only add `positiveExpensesByCounterparty: { cpId: amount }` | Rejected | Solves the immediate need but doesn't enable any of the future drill-downs or insights. Same migration cost. |
| Inverse 2D map: `expensesByCounterpartyAndCategory: { cpId: { catId: amount } }` | Rejected | Same data, but the dominant access pattern in the codebase is "iterate categories, sum cps" (positive-expense filter, future "category by counterparty" drill-down). The chosen orientation is faster for that. |
| Store **both** orientations | Rejected | Doubles storage, doubles the sync surface, no concrete read-side benefit |
| Snapshot category names/colors per report | Rejected | Categories are rarely renamed; resolution against the live `categories` collection works fine |
| `firstTransactionDate` / `lastTransactionDate` per month | Rejected | Low value, costs space; same info derivable from raw transactions if needed |
| Tags / labels field | Rejected | No tag feature exists; premature |
| Min/max/avg pre-computed per category | Rejected | Counts + amount lets us derive the average; min/max would need dedicated tracking but no use case |
| Removing the redundant top-level aggregates (`totalIncome`, root `expensesByCategory`, etc.) | Rejected | Removing breaks 30+ consumers; redundancy is a smell but not load-bearing right now |
| Renaming existing fields to a more uniform shape (`categories.expense`, etc.) | Rejected | Pure cosmetic; cost of touching every consumer is disproportionate |
| Unifying deposits/expenses into `categories: { catId: { deposits, expenses, count } }` | Rejected | Same reason as rename — large blast radius for a cosmetic gain |
| Multi-currency fields | Rejected | Not on the product roadmap |
| Investment yield / portfolio tracking | Rejected | Different feature, would live in its own document |
| Rateio for multi-category transactions instead of double-counting | Deferred | The "full amount per category" design is intentional; revisit if a real user complaint surfaces |

### Storage estimate

Per active month, for a typical user (~30 transactions, ~20
distinct (catId, cpId) pairs, ~15 categories with activity, ~20
counterparties with activity):

- Cross-ref map: ~20 entries × 30 bytes ≈ 600 B
- Counts (4 maps): ~70 entries × 20 bytes ≈ 1.4 KB
- `transactionCount`: ~10 B

≈ **2 KB extra per month**. Five years of monthly data ≈ **120 KB**
of additional storage per report. The Firestore document size limit
is 1 MB; we are nowhere near it.

For power users (~150 transactions, ~80 (catId, cpId) pairs):
≈ **6 KB per month**, 5 years ≈ **360 KB**. Still safe.

### Testing strategy

- **Unit tests for `apply-transaction-to-report`**: cover create
  (direction=1) and delete (direction=-1) for each new field, with
  and without counterparty, with and without positive-expense
  categories, with multi-category transactions.
- **Unit test for the aggregator**: verify the counterparty
  filtering subtracts correctly, handles the edge case where
  subtraction would go negative (it shouldn't, but guard anyway),
  and removes zero entries.
- **Sync test review**: every cascade-delete / cascade-update test
  must assert the new fields are kept consistent.
- **Schema test**: load a fixture report from the pre-migration
  shape and confirm it parses cleanly with all new fields defaulting
  to `{}`.
- **Manual verification** in browser at `/dashboard/relatorios`:
  toggle "incluir investimentos" off → both donuts (Categoria and
  Identificador) lose investment-related slices. Toggle on → both
  return.

### Out of scope (separate follow-ups)

- Building the new drill-downs (`Mercado por contraparte`, etc.)
  that the cross-ref enables. The schema is the foundation; the
  UIs are separate enhancements.
- Frequency-based insights ("47 idas no Mercado"). New
  `calculate-report-insights` cases.
- Per-counterparty Objetivos. Coordinated with the budget
  feature obs.
- Auto-rebuild on schema version bump.
- Reformulating the multi-category rateio rule.
- Top-level `expensesByCategoryAndCounterparty` aggregate (across
  the whole report). Can be added later if needed.

## Resolution

Shipped 2026-04-11 in a single pass covering schema, builder, and
aggregator. Verified end-to-end: `pnpm ts-check` clean, 212 unit
tests passing (including 4 new cases for the counterparty filter).

### What shipped

**Schema** (`src/@schemas/models/report.ts`) — `zMonthlyEntry`
gained 7 new fields, all with `.default(...)` so old documents
parse cleanly without migration:

- `transactionCount: number` — per-month count
- `expensesByCategoryAndCounterparty` / `depositsByCategoryAndCounterparty`
  — 2D cross-reference maps keyed `[categoryId][counterpartyId]`
- `expensesByCategoryCount` / `depositsByCategoryCount`
- `expensesByCounterpartyCount` / `depositsByCounterpartyCount`

Root `zReportBase` was intentionally **not** touched — consumers
that need cross-period totals sum across `monthlyBreakdown`.

**Builder** (`apply-transaction-to-report.ts`) — rewritten with
three small helpers (`applyCurrencyDelta`, `applyCountDelta`,
`applyNestedCurrencyDelta`) plus `createEmptyMonthlyEntry()`. A
defensive `{ ...createEmptyMonthlyEntry(), ...existing }` spread
handles old reports in memory — their monthlyBreakdown entries
lack the new fields at runtime (firebaseGet casts without Zod
parsing), and this backfills them.

**Simplification from the original plan**: the obs proposed
threading a `positiveExpenseCategoryIds: Set<string>` prop
through the builder (and therefore through every caller). The
shipped implementation populates the cross-ref map
**unconditionally** — every (catId, cpId) pairing is stored —
which means:

1. No builder prop, no caller changes. `rebuild-report.ts`,
   `update-report.ts`, `update-report-bulk.ts`, and all transaction
   services (create/update/delete/import) are untouched.
2. The cross-ref is strictly more useful for future features —
   any drill-down (not just positive-expense) can index into it.
3. Storage cost is the same as the original plan.

**Aggregator** (`aggregate-period-breakdowns.ts`) — when
`includePositiveExpenseCategories = false`, walks the cross-ref
map, sums the positive-expense slice per counterparty across the
selected months, and subtracts at the end. If a counterparty's
total goes to zero or below, it drops from the donut entirely.

On old reports that haven't been Recalcular'd yet, the cross-ref
is empty for every month, so the subtraction silently no-ops —
the category donut is still filtered (from the existing 1D map),
but the counterparty donut stays unchanged until the user runs
Recalcular. No crash, no wrong data, just "old behavior" until
rebuild.

### What was NOT touched (and why)

- **`rebuild-report.ts`** — the root `emptyBase` literal is unchanged
  because only `IMonthlyEntry` gained fields. The new fields only
  materialize when a transaction is applied to a month.
- **`create-empty-report.ts`** — same reason; empty reports start
  with an empty `monthlyBreakdown: {}`.
- **Transaction services (create/update/delete/import)** — never
  touched the builder signature.
- **Sync paths** (`cascade-delete-counterparty`, `cascade-delete-category`,
  `cascade-update-counterparty-category-ids`,
  `remove-counterparty-from-report`, `remove-category-from-report`)
  — these already had a pre-existing gap: they only clean root-level
  maps, not `monthlyBreakdown`. That means orphan IDs already live
  in the existing 1D monthly maps, and now will also live in the
  new cross-ref maps. **Not a regression**: the aggregator iterates
  live categories/counterparties from their collections, so orphan
  entries in the cross-ref are never read. Storage cost for orphans
  is negligible. Full cleanup still comes from the **Recalcular**
  button.

### Test coverage added

- `tests/helpers/factories.ts` — `makeMonthlyEntry` initializes all
  new fields to `{}` / `0`.
- `tests/unit/reports/apply-transaction-to-report.test.ts` — updated
  fixtures in the 3 tests that compared the full `IMonthlyEntry`
  shape (expense/deposit increment, delete decrement,
  Math.max(0) guard).
- `tests/unit/reports/report-double-count.test.ts` — updated the
  final `toEqual` assertion to use `makeMonthlyEntry`.
- `tests/unit/analytics/aggregate-period-breakdowns.test.ts` —
  added a new `describe("positive-expense filter (cross-ref map)")`
  block with 4 cases:
  1. Toggle OFF subtracts the positive slice from counterparty totals.
  2. Toggle ON preserves counterparty totals untouched.
  3. Partial subtraction when a single counterparty has both
     positive and regular expenses (result = regular amount).
  4. Old reports with empty cross-ref silently no-op (no crash,
     counterparty totals unchanged, category side still filtered).

### Migration

No code migration. The user needs to click **Recalcular** once per
bank account on `/dashboard/relatorios` to populate the new fields
from raw transactions. Until then, the counterparty filter shows
"old behavior" (unfiltered), but nothing crashes.

### Manual verification checklist

1. Open `/dashboard/relatorios`.
2. Click **Recalcular**, wait for the rebuild to complete.
3. Toggle "incluir investimentos" OFF → both donuts (Saídas por
   Categoria **and** Saídas por Identificador) should lose
   investment-related slices consistently.
4. Toggle ON → both return.
