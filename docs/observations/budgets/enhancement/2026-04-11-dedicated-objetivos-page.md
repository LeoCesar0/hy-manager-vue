---
status: resolved
type: enhancement
severity: medium
retention: reference
found-during: "discussing budget feature scope"
found-in: "src/components/Reports/BudgetSettingsDialog.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-11
updated: 2026-06-19
resolved-date: 2026-06-19
discard-reason:
deferred:
related-commits:
  - e99c8a8
  - 54f40aa
---

# Dedicated "Objetivos" page with sidebar entry

## What was found
Objetivos (a.k.a. budgets) are currently only reachable from the reports
screen via a small "Configurar" button that opens `BudgetSettingsDialog`.
There's no first-class page, no sidebar entry, and no way to browse/edit
objetivos without going through Relatórios → current bank account. For a
feature that holds monthly limits, income goals, and per-category
targets, this is too buried — especially for users with multiple bank
accounts, who today can only reach an account's objetivo by first
selecting that account in reports.

Scope: this page works with the **current per-account model** —
objetivos stay strictly bound to a single bank account (see
`2026-04-11-global-vs-per-account-scope.md`, deferred). The page is a
management surface for per-account objetivos, not a global one.

## Where
- `src/pages/dashboard/relatorios/index.vue` — current entry point
  (inside the reports layout).
- `src/components/Reports/BudgetSettingsDialog.vue` — only edit surface
  today.
- `src/components/Reports/ReportsBudgetTracking.vue` — display-only
  card; should coexist with the new page (page = configuration, reports
  card = progress view).
- `src/static/routes.ts` — needs a new `objetivos` (or `budgets`) entry
  in `ROUTE` with `menu: { icon, group: 'management' }` so the sidebar
  picks it up automatically.
- New page to create under `src/pages/dashboard/objetivos/index.vue`
  (matching the Portuguese URL convention used for
  `transacoes`, `categorias`, `terceiros`, `contas-bancarias`).

## Why it matters
- Users with multiple bank accounts can't realistically manage objetivos
  via a dialog scoped to whatever account happens to be selected in
  reports — they need a list of all objetivos in one place.
- The dialog has no affordance for deleting an objetivo doc or seeing
  at a glance which accounts have an objetivo configured and which
  don't.
- Parity with other management features (Categorias, Identificadores,
  Contas Bancárias) — every other core entity has its own page.
- Enables progressive disclosure: reports keeps the compact progress
  card and deep-dives happen on the dedicated page.

## Suggested approach
1. Add the route to `src/static/routes.ts` with
   `menu: { icon: TargetIcon /* or similar */, group: 'management' }`
   so the sidebar picks it up. Use label `"Objetivos"` (aligns with the
   rename in `2026-04-11-rename-budgets-to-objetivos.md`).
2. Create `src/pages/dashboard/objetivos/index.vue` modelled on
   `categorias/index.vue` — a `DashboardSection` with a table or list
   of configured objetivos, one row per bank account.
3. Columns/fields: conta bancária, limite de gastos mensal, meta de
   receita mensal, nº de categorias configuradas, ações
   (editar/deletar).
4. Reuse `BudgetSettingsDialog` (or refactor it into a sheet) for the
   edit flow. Don't duplicate the form.
5. Keep the reports progress card (`ReportsBudgetTracking.vue`) — it's
   a different surface (monitoring vs. configuration). Its "Configurar"
   button can deep-link to the new page instead of opening the dialog
   directly.
6. On a fresh account with no objetivo yet, the reports card should
   link to the page (empty state there already exists).
7. List source: today budgets are fetched with
   `getOrCreateBudget({ bankAccountId })` — for a list view we need a
   `listBudgets({ userId })` service that queries the `budgets`
   collection by `userId` and returns one objetivo doc per bank
   account (including bank accounts without an objetivo yet, so the
   page can offer a "Criar objetivo" row for them).

## Open questions
- Should the page group objetivos by month or be "always current
  month"? Today the schema has no month field — budgets are implicitly
  "the one active now". If we ever want historical tracking, that's a
  separate discussion.
- Does the reports card keep the inline-edit dialog or always push to
  the page? My lean: keep the dialog as a shortcut, since going to
  another page mid-report breaks flow.

## Progress

### 2026-06-19 — Implemented dedicated Objetivos page (per-account model)

Decisions taken (resolving the open questions with the pragmatic defaults):
- **Always-current-month**: schema has no month field, so the page works
  on the single active objetivo doc per account. No grouping.
- **Reports card unchanged**: kept its inline `BudgetSettingsDialog`
  shortcut (the lean above). The reports flow is untouched.

Approach:
- Route `budgets` added to `src/static/routes.ts` → path
  `/dashboard/objetivos`, label `"Objetivos"`,
  `menu: { icon: TargetIcon, group: 'management' }`. The dashboard layout
  (`src/layouts/dashboard.vue`) auto-derives the sidebar from `ROUTE`
  entries with a `menu`, so the entry appears under "Gerenciamento"
  automatically.
- New list service `listBudgets({ userId })`
  (`src/services/api/budgets/list-budgets.ts`) — single-field `userId`
  filter via `firebaseList`, returns existing budget docs only. **No
  composite Firestore index required.** `budgets` collection was already
  registered in `collections.ts` and already has read rules in
  `firestore.rules` (`allow read: if isResourceOwner()`) — no schema or
  rules change needed.
- Pure join helper `buildObjetivoRows({ bankAccounts, budgets })`
  (`src/helpers/budget/buildObjetivoRows.ts`) joins the dashboard store's
  bank accounts with the budget docs (matched by `bankAccountId`, which
  equals the doc id) to produce one row per account — including accounts
  with no doc (`isConfigured: false` → "Criar objetivo" affordance). A
  bare doc (all-null fields, created by `getOrCreateBudget`) also counts
  as not-configured. Covered by 6 unit tests in
  `tests/unit/helpers/build-objetivo-rows.test.ts` (all green).
- Page `src/pages/dashboard/objetivos/index.vue` modelled on
  `contas-bancarias/index.vue` (tanstack `Table`). Columns: conta
  bancária, limite de gastos mensal, meta de receita mensal, nº de
  categorias configuradas, ações. Reuses `BudgetSettingsDialog`
  unchanged (it is account-agnostic). Edit/create both go through
  `getOrCreateBudget` (to obtain a real doc) → `updateBudget` on save,
  mirroring the reports `handleSaveBudget`. Delete reuses `deleteBudget`
  via `useAlertDialog`. Bank accounts come from `useDashboardStore`
  (loaded globally), categories from `useReferenceDataStore`.

Verification:
- `pnpm run ts-check` → clean.
- `pnpm test:unit` → 49 files, 305 tests, all passing (includes the 6
  new helper tests).
- The `.vue` page rendering and sidebar wiring are visual/DOM and are
  NOT verified by unit tests — see Pending Validation.

### 2026-06-19 — Redesign: scoped to current account + expanded form (supersedes the table approach above)

User feedback after seeing the first cut: the table-of-all-accounts
contradicts the app's core pattern (every dashboard page operates on the
**currently-selected bank account**, like Relatórios), and a conventional
table was not the desired surface. The requested direction: take the
content of the "Configurar Objetivo" dialog and expand it to fill the
page, scoped to the current account.

What changed:
- **Form extracted for reuse**: the dialog's field body became a shared
  presentational component `src/components/Reports/BudgetSettingsForm.vue`
  (two overall inputs + the per-category list). It hydrates from the
  `budget` prop on mount and exposes `getPayload()` via `defineExpose`;
  parents own the action buttons and remount it via `:key` to re-hydrate.
  It also exports the shared `IBudgetFormPayload` type (single source for
  the `onSave` contract).
- **Dialog now wraps the form**: `BudgetSettingsDialog.vue` renders
  `BudgetSettingsForm` with `v-if="open"` (remount-on-open preserves the
  old "cancelled edit doesn't carry over" behaviour) and keeps its
  Cancelar/Salvar footer. Reports flow is behaviourally unchanged.
- **Page rebuilt** (`objetivos/index.vue`): no table. It reads
  `currentBankAccount` from `useDashboardStore`, loads that account's
  budget via `getOrCreateBudget`, and renders `BudgetSettingsForm`
  full-width in a `UiCard` (max-w-3xl). Actions: **Salvar objetivo**
  (`updateBudget`) and **Limpar objetivo** (only when configured — clears
  to null/null/[] via `updateBudget` behind an `useAlertDialog` confirm).
  Subtitle names the current account to make the scope explicit. Empty
  state when no account is selected. A `watch` on
  `currentBankAccount.id` reloads on account switch.
- **Dead code removed**: `list-budgets.ts`, `buildObjetivoRows.ts` and
  `tests/unit/helpers/build-objetivo-rows.test.ts` (the table-only join +
  list-all service) were deleted — the page no longer lists all accounts,
  so the per-account `getOrCreateBudget` is sufficient and cheaper (no
  full-collection read).

Resolved the original open questions: still **always-current-month**
(no month field in schema); reports keeps its dialog shortcut.

Verification after redesign:
- `pnpm run ts-check` → clean.
- `pnpm test:unit` → 48 files, 299 tests passing (the 6 now-obsolete
  `buildObjetivoRows` tests were removed with the helper).
- The page rendering, sidebar wiring and live save/clear are visual/DOM +
  Firestore-backed → NOT unit-verifiable; see Pending Validation.

## Resolution

Resolved 2026-06-19. Shipped in two steps: the initial build (table of all
accounts) in commit `e99c8a8`, then the redesign described in the Progress
note above — the authoritative final shape. The page is now a per-account
configuration workspace, not a list.

Final delivered behavior:
- **Sidebar entry** — "Objetivos" under "Gerenciamento" (target icon) →
  `/dashboard/objetivos`, auto-derived from the `ROUTE` entry.
- **Scoped to current account** — reads `currentBankAccount` from
  `useDashboardStore`; the subtitle names the account and switching
  accounts reloads that account's objetivo (matches the app's per-account
  page pattern).
- **Expanded form** — the shared `BudgetSettingsForm` (overall expense
  limit + income goal + per-category list) renders full-width in a card;
  the same component backs the reports "Configurar Objetivo" dialog.
- **Save / Clear** — "Salvar objetivo" persists via `updateBudget`;
  "Limpar objetivo" (only when configured) resets to null/null/[] behind
  an `useAlertDialog` confirm.
- **Empty state** — "Nenhuma conta selecionada" when no account is active.
- **Reports unchanged** — the budget card + dialog still work.

Code-level verification: `pnpm run ts-check` clean; `pnpm test:unit` 299
passing. The user validated the rendered page, sidebar and live save/clear
in production at deploy time.
