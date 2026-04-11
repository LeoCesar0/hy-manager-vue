---
status: open
type: enhancement
severity: low
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

# Rename "Orçamento" to "Objetivos" in UI labels

## What was found
The feature currently surfaces under the label "Orçamento" across the
reports screen and the configuration dialog. We want to rebrand it to
"Objetivos" everywhere the user sees it, keeping the underlying schema,
collection, service and type names (`budget`, `IBudget`, `budgets/*`,
`BudgetSettingsDialog`, etc.) untouched — this is a UI-only change.

## Where
UI copy referencing "Orçamento" / "orçamento" that needs to change:

- `src/components/Reports/ReportsBudgetTracking.vue` — card title
  "Orçamento", empty-state copy "Nenhum orçamento configurado…",
  button "Configurar Orçamento".
- `src/components/Reports/BudgetSettingsDialog.vue` — dialog title
  "Configurar Orçamento" and description copy.
- `src/services/analytics/calculate-budget-progress.ts` — labels
  "Limite de gastos mensal" / "Meta de receita mensal" passed to the
  progress items (these are fine as-is; they're sub-labels, not the
  feature name).
- `src/services/api/budgets/*` — toast strings passed through
  `getDefaultCreateToastOptions` / `getDefaultUpdateToastOptions` use
  `itemName: "Orçamento"`. Change to `"Objetivo"`.
- Any other literal "Orçamento" / "orçamentos" string that surfaces to
  the user (grep before merging).

## Why it matters
Consistent user-facing vocabulary — the team decided "Objetivos" reads
better for the mix of limits and goals the feature already covers
(spending limits, income goals, per-category targets). Keeping internal
names (`budget`, `budgets`) avoids a churny rename of schema, services,
Firestore collection, analytics helpers and tests for zero functional
gain.

## Suggested approach
1. Grep for `Orçamento|orçamento|Orcamento|orcamento` under `src/` and
   replace only the user-visible strings (templates, toast messages,
   dialog copy, sidebar entry once #2 lands).
2. Leave type names, file names, collection names, and Firestore doc
   paths alone.
3. Verify labels that go into `calculateBudgetProgress` are what the
   user actually reads on the bars and adjust if needed.
4. Reuse the rename opportunity to audit for stale copy while the
   strings are already in hand — but don't extend scope beyond UI.
