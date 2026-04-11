---
status: open
type: enhancement
severity: medium
found-during: "discussing budget feature scope"
found-in: "src/components/Reports/BudgetSettingsDialog.vue"
working-branch: ""
found-in-branch: "main"
date: 2026-04-11
updated: 2026-04-11
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
