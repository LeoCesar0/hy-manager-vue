---
status: open
type: enhancement
severity: low
found-during: "discussing budget feature scope"
found-in: "src/@schemas/models/budget.ts"
working-branch: ""
found-in-branch: "main"
date: 2026-04-11
updated: 2026-04-11
resolved-date:
discard-reason:
deferred: true
---

# Support global objetivos (deferred — blocked on global reports feature)

## Status (updated 2026-04-11)
**Deferred.** After weighing the options we decided to keep objetivos
strictly per-bank-account for now (the current behaviour). Global
objetivos only make sense once the app has a **global / cross-account
reports feature** — i.e. a way to view spending and income aggregated
across all of a user's bank accounts. Without that surface, a "global"
limit has nowhere to be measured against in a way that matches the
user's mental model, and the current per-account reports screen
already handles per-account objetivos well.

Do not re-surface this observation until the global reports feature is
on the table. When that happens, revisit this file to re-evaluate both
the semantic model and the schema changes below.

## What was found (original context)
Today every objetivo (budget) is strictly bound to a single bank
account: the schema requires `bankAccountId: zStringNotEmpty`
(`src/@schemas/models/budget.ts:13`) and the Firestore doc id is the
`bankAccountId` itself
(`src/services/api/budgets/get-or-create-budget.ts:14` — firebaseGet
with `id: bankAccountId`, createBudget with `id: bankAccountId`). For a
user with multiple accounts this means configuring the same limits
over and over, once per account.

The original request was to support **global (default) objetivos** that
apply across the user's accounts, to remove this duplication.

## Where (for reference when we pick this back up)
- `src/@schemas/models/budget.ts` — `bankAccountId` currently
  non-nullable; would need to become nullable or accompanied by an
  explicit `scope` discriminator.
- `src/services/api/budgets/get-or-create-budget.ts` — doc id
  hardcoded to `bankAccountId`, would need a resolution chain.
- `src/services/api/budgets/create-budget.ts`,
  `update-budget.ts`, `delete-budget.ts` — id generation and lookups
  assume one-doc-per-account.
- `src/services/analytics/calculate-budget-progress.ts` — takes a
  single `IBudget` today; aggregate-mode objetivos would need to sum
  across accounts.
- `src/components/Reports/ReportsBudgetTracking.vue` and
  `BudgetSettingsDialog.vue` — would need UI to indicate scope.
- `firestore.rules` — budget doc id stops being a predictable
  `bankAccountId` string, so rules would need to validate `userId`
  ownership instead of id shape.

## Why it was deferred
Global objetivos need somewhere to be displayed that matches the user's
mental model. The current Relatórios screen is scoped to a single
`currentBankAccount` — it shows progress for that account's monthly
data only. A global objetivo dropped into that context either:

- degrades to "template applied per-account" (fine, but doesn't
  actually change what the user sees — every account keeps being
  evaluated against the same number separately), or
- requires a cross-account aggregated view that does not exist yet.

Building the schema + UI plumbing for global objetivos before the
aggregated reports feature exists means we'd ship a configuration
surface with nowhere meaningful to display the result. Better to wait
until the reports side is ready and design both at once.

## Trigger to revisit
Reopen (remove `deferred: true`) when any of the following lands or is
actively being scoped:

- A "Visão global" / "Todas as contas" reports view that aggregates
  spending and income across the user's bank accounts.
- A dashboard widget that sums monthly data across accounts.
- A user request for a single consolidated monthly limit across
  multiple accounts.

## Design notes to preserve for the future
When this does come back, the previous analysis identified two
distinct semantics that need to be chosen between up front:

**(a) Template / default.** A global objetivo is a template whose
limits apply to each account individually. Per-account docs, if they
exist, override the global one entirely. Cheap to implement — reuses
`calculateBudgetProgress` unchanged; resolution is just "per-account
doc if present, else global doc, else empty".

**(b) Aggregate / cross-account.** A global objetivo is a single
ceiling against the summed activity of all accounts. Requires a new
analytics path that aggregates `monthlyEntries` across accounts and a
reports surface designed around the aggregate. This is the model that
actually benefits from a global reports feature, which is why
deferring this observation until that feature exists is the right
call.

## Dependencies
- Blocked on: **global / cross-account reports feature** (not yet
  tracked as an observation — create one when the idea is ready).
- Independent of: `2026-04-11-rename-budgets-to-objetivos.md` (rename
  is UI-only).
- Independent of: `2026-04-11-dedicated-objetivos-page.md` (the
  dedicated page works with today's per-account model — see that obs
  for the updated, per-account-only scope).
