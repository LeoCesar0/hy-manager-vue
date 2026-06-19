---
status: awaiting-validation
type: enhancement
severity: medium
retention: reference
found-during: "discussing budget feature scope"
found-in: "src/components/Reports/BudgetSettingsDialog.vue"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-11
updated: 2026-06-19
resolved-date:
discard-reason:
deferred:
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

New user-facing copy uses "Objetivos" (not "Orçamento") on the new page
and sidebar, per the upcoming rename task. The existing reports
card/dialog copy ("Orçamento") was intentionally left untouched.

## Pending Validation

What was done: see Progress. The following require manual eyeballing in a
running dev server (`pnpm run dev`) because they are visual/DOM and
Firestore-backed:

1. **Sidebar entry** — "Objetivos" appears under "Gerenciamento" with a
   target icon, navigates to `/dashboard/objetivos`.
2. **List** — the page shows one row per bank account, including accounts
   with no objetivo (showing "—" for the money columns, `0` categories,
   and a "Criar objetivo" link instead of edit/delete).
3. **Create/edit** — clicking "Criar objetivo" or the edit (pencil) icon
   opens `BudgetSettingsDialog`; saving persists and the row updates
   (money columns + category count reflect the new values; the row
   switches to edit/delete actions).
4. **Delete** — the trash icon prompts a confirm dialog and, on confirm,
   removes the objetivo (row reverts to "Criar objetivo").
5. **Reports unchanged** — `/dashboard/relatorios` still shows the
   Orçamento card and its "Configurar" dialog still works for the
   currently-selected account.

Do not mark resolved until the user confirms the above.
