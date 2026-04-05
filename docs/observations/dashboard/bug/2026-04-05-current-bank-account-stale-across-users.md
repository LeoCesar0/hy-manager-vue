---
status: open
type: bug
severity: high
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/composables/stores/useDashboardStore.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
discard-reason:
deferred:
---

# currentBankAccount leaks across users via unscoped localStorage key

## What was found

`useDashboardStore` persists the selected bank account id to localStorage under a **global** key `"lastSelectedBankAccountId"` (not namespaced by user id). When user B logs in on a browser that previously had user A logged in, two things happen on `loadBankAccounts`:

1. `foundStoredAccount` looks up user A's account id inside user B's account list → not found, so the code falls through to `bankAccounts.value[0]`.
2. The `bankAccounts.value[0]` fallback is **the first item in the list**, not the most recently used or last updated account. There's no sort guarantee on `bankAccounts` either — the actual account selected depends on whatever order `getBankAccounts` returns.

Net effect: the newly-logged-in user gets a semi-random bank account selected (first in list), instead of a sensible default like "the one you used most recently" or "the most recently updated".

## Where

- `src/composables/stores/useDashboardStore.ts:25-31` — `lastSelectedBankAccountId` useLocalStorage, globally scoped key
- `src/composables/stores/useDashboardStore.ts:56-69` — fallback to `bankAccounts.value[0]` when stored id doesn't match
- `src/composables/stores/useDashboardStore.ts:86-94` — watcher on `currentUser` that re-runs `loadBankAccounts` on user change

## Why it matters

- **User confusion**: a returning user sees a bank account that wasn't the one they were last working with, with no clear reason why.
- **Data mix-up risk**: if user A and user B share a device, user A's selected account id persists in localStorage until overwritten. Not a data leak (user B still only sees their own accounts), but the selection fallback is arbitrary.
- **Freshness**: the "first in list" fallback doesn't match any user mental model — picking "most recently updated" or "first alphabetical" would at least be predictable.

## Suggested approach

Two independent fixes that both need to land:

**Fix 1 — namespace the storage key by user id:**
```ts
const lastSelectedBankAccountId = useLocalStorage<string | null>(
  computed(() => currentUser.value ? `lastSelectedBankAccountId:${currentUser.value.id}` : "lastSelectedBankAccountId:__anon"),
  null,
  { serializer: StorageSerializers.string },
);
```
`useLocalStorage` from `@vueuse/core` accepts a reactive key — verify the API supports that and adjust the shape if needed. This way, user A and user B each have their own stored preference, and switching users picks up the right one automatically.

**Fix 2 — pick a sensible default when no stored id exists:**
- Best: most recently updated account (sort by `updatedAt` desc, pick first)
- Acceptable: most recently created (sort by `createdAt` desc, pick first)
- Current: arbitrary list order — bad

Apply both. Fix 1 alone leaves the "no stored id" case broken; Fix 2 alone still leaks across users on the very first login.

**Also check `resetStore()`** — it clears in-memory refs but not the localStorage key. On an explicit logout, the stored id lingers. Either clear it in `resetStore` or (better) let Fix 1's per-user namespacing make it moot.

**Test cases worth writing:**
- User A selects account X, logs out, user B logs in → user B gets their most-recent account, not X
- User A selects X, refreshes the page → user A still gets X
- User A has 3 accounts, no stored id → gets the most recently updated one
- User A's stored id is for an account they later deleted → fallback kicks in correctly
