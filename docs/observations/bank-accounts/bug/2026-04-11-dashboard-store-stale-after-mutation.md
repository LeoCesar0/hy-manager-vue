---
status: resolved
type: bug
severity: medium
retention: reference
found-during: "reviewing bank account edit flow"
found-in: "src/composables/stores/useDashboardStore.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-11
updated: 2026-06-19
resolved-date: 2026-06-19
discard-reason:
deferred:
related-commits:
  - e99c8a8
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

## Progress

- 2026-06-19 — Confirmed the bug still reproduces in current code: the three
  bank-account API services (`create`/`update`/`delete`) write to Firestore and
  toast but never touch `useDashboardStore`. The store only populated its
  `bankAccounts`/`currentBankAccount` via the `currentUser` watcher's
  `loadBankAccounts()` and exposed no mutation hooks.
- Implemented Option 2. Extracted the state-merge logic into two pure helpers
  and unit-tested them first (TDD): `tests/unit/helpers/bank-account-state.test.ts`
  — 10 cases (create append, auto-select when none selected, in-place replace,
  patch-current-on-update, delete-current-with-most-recent fallback, delete to
  empty → null, no-op for non-selected). Watched them fail (module not found),
  then created the helpers, then green (10/10).
- Full unit suite: `pnpm test:unit` → 48 files, 299 tests passed.
- `pnpm run ts-check` → clean (no errors).

## Resolution

Implemented the approved Option 2: `useDashboardStore` now exposes three
mutation-aware actions — `createBankAccount`, `updateBankAccount`,
`deleteBankAccount` — that wrap the existing API services and patch the store's
in-memory snapshot on success. All UI call sites were switched from the raw
services to these store actions, so the globally-shared state stays consistent
without a page reload.

**Files changed:**
- `src/helpers/bank-account/applyBankAccountUpsert.ts` (new) — pure: replace by
  id or append; patch `current` when the upserted id is selected; auto-select
  when nothing is selected.
- `src/helpers/bank-account/applyBankAccountRemoval.ts` (new) — pure: filter by
  id; when the removed account was selected, fall back to the
  most-recently-updated survivor (mirrors `loadBankAccounts`) or `null` when
  empty.
- `src/composables/stores/useDashboardStore.ts` — added the three actions
  (wrapping the API services + applying the helpers) and exported them.
- `src/components/BankAccounts/BankAccountForm.vue` — create/update now call
  `dashboardStore.*` instead of the services directly.
- `src/pages/dashboard/contas-bancarias/index.vue` — delete via the store action.
- `src/pages/dashboard/contas-bancarias/[id].vue` — delete via the store action.
- `src/composables/useOnboarding.ts` — create via the store action so the new
  account is in the store before redirecting to the dashboard.
- `tests/unit/helpers/bank-account-state.test.ts` (new) — 10 unit tests for the
  helpers.

**Before → after:**
- Before: create/update/delete hit Firestore only; the account switcher, header,
  reports filters, and onboarding kept serving the stale snapshot until a full
  reload; a deleted current account stayed selected, briefly pointing queries at
  a non-existent id.
- After: the store list and `currentBankAccount` update immediately on each
  mutation. Updates patch the selected account in place; deletes of the current
  account fall back to the most-recently-updated remaining one (or null); creates
  auto-select when nothing was selected.

**Design note (reference):** the pure-helper + thin-store-action split keeps the
merge logic fully unit-testable without Pinia/Nuxt-auto-import mocking, and keeps
the "UI never touches Firebase directly" rule intact (UI → store action → API
layer → Firestore). This mirrors the load-once + refresh-on-mutation intent of
`useReferenceDataStore`, but uses targeted in-memory patches (no re-fetch)
because the mutation response already returns the full updated document.

**Not verified by tests (unit-only):** the actual Pinia reactivity wiring inside
the store actions and the Vue components re-rendering on the ref change are not
exercised by the unit suite (the store reads Nuxt auto-imports that the test env
doesn't bootstrap). The pure merge logic — the part that holds the fallback and
selection rules — is fully covered. The store actions are thin pass-throughs
that apply those helpers, and ts-check confirms the wiring type-checks.

## Things tried that didn't work

- Considered testing the full Pinia store directly. Rejected: the store depends
  on Nuxt auto-imports (`defineStore`, `storeToRefs`, `useUserStore`, `ref`,
  `watch`) that the node test environment does not bootstrap, and there are no
  existing store tests to mirror. Extracting the logic into pure helpers gave
  better coverage with less mocking.
