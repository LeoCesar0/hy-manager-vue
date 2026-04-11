---
status: open
type: bug
severity: medium
found-during: "reviewing bank account edit flow"
found-in: "src/composables/stores/useDashboardStore.ts"
working-branch: ""
found-in-branch: "main"
date: 2026-04-11
updated: 2026-04-11
resolved-date:
discard-reason:
deferred:
---

# Dashboard store bank accounts stale after create/update/delete

## What was found
When a bank account is created, updated, or deleted, the `useDashboardStore`
state (`bankAccounts` and `currentBankAccount`) is not refreshed. The mutation
only hits Firestore via `create-bank-account.ts` / `update-bank-account.ts` /
`delete-bank-account.ts`, and the store keeps serving its in-memory snapshot
from the initial `loadBankAccounts()` call triggered by the `currentUser` watcher.

The listing page at `src/pages/dashboard/contas-bancarias/index.vue` has its
own local `bankAccounts` ref and reloads it on `handleUpdateSuccess` /
`handleCreateSuccess` / `handleDelete`, so the table row looks correct — but
the globally shared store (used by the account selector, dashboard header,
reports filters, onboarding, etc.) still holds the pre-edit object. The
currently selected account also keeps its old `name` / `company` values.

## Where
- `src/composables/stores/useDashboardStore.ts` — no mutation hooks to sync state
- `src/services/api/bank-accounts/create-bank-account.ts`
- `src/services/api/bank-accounts/update-bank-account.ts`
- `src/services/api/bank-accounts/delete-bank-account.ts`
- `src/components/BankAccounts/BankAccountForm.vue` — calls the services but
  doesn't notify the store
- `src/pages/dashboard/contas-bancarias/index.vue:111-119` — only reloads the
  page-local list, not the store

## Why it matters
- The account switcher and any component reading `bankAccounts` from the
  dashboard store shows the old name/company until a full page reload or user
  switch.
- If the edited account is `currentBankAccount`, every screen that derives
  data from it (dashboard header, transactions filters, reports) keeps
  showing stale fields.
- Newly created accounts don't appear in the switcher until reload.
- Deleted accounts remain selectable until reload, which can briefly point
  queries at a non-existent id.

## Suggested approach
Expose mutation-aware helpers from `useDashboardStore` (e.g.
`upsertBankAccount(account)`, `removeBankAccount(id)`) and either:

1. Call them from `BankAccountForm.vue` / the delete handler after each
   successful API response, or
2. Move the mutation calls into thin store actions that wrap the API
   services and update local state on success.

On update, also patch `currentBankAccount` if its `id` matches. On delete,
if the removed account was current, fall back to the most-recently-updated
remaining account (mirroring the `loadBankAccounts` fallback) or `null` when
the list becomes empty. Creation should append and, if `currentBankAccount`
is still `null`, auto-select the new one.

Option 2 is preferable — it keeps the "UI never touches Firebase directly"
rule intact, centralises the sync logic, and avoids every caller having to
remember to ping the store.
