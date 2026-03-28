---
status: open
type: enhancement
severity: medium
found-during: "brainstorm session - counterparty management improvements"
found-in: "src/pages/dashboard/terceiros/index.vue"
found-in-branch: "main"
date: 2026-03-28 10:00
updated: 2026-03-28 10:30
resolved-date:
discard-reason:
deferred:
---

# Proactive suggestion system for uncategorized counterparties

## What was found
Counterparties can exist with empty `categoryIds` arrays. This happens commonly because:
- Transactions imported via CSV create counterparties automatically without categories
- Users creating transactions often skip or don't know the counterparty's category
- The `getOrCreateCounterparty` service creates counterparties with optional categoryIds

There is no mechanism to proactively surface uncategorized counterparties to the user or guide them to categorize the most impactful ones first.

## Where
- `src/services/api/counterparties/get-or-create-counterparty.ts` — creates counterparties without requiring categories
- `src/pages/dashboard/terceiros/index.vue` — existing counterparty management page (no categorization prompts)
- `src/@schemas/models/counterparty.ts` — `categoryIds` is a simple array, no validation for non-empty

## Why it matters
Uncategorized counterparties mean uncategorized transactions, which makes reports, budgets, and analytics incomplete and less useful. A user with 100+ imported transactions might have dozens of uncategorized counterparties and no easy way to prioritize which ones to fix first. Categorizing by spending volume would have the highest impact on report accuracy.

## Suggested approach (decided)

### UI — three touch points
1. **Banner no dashboard principal** — alerta tipo "Você tem X terceiros sem categoria que representam Y% das suas transações". Link para a página dedicada.
2. **Banner na página de terceiros** (`/dashboard/terceiros`) — destaque similar, link para a página dedicada.
3. **Página dedicada de categorização** — nova rota (ex: `/dashboard/terceiros/categorizar`) com foco exclusivo em resolver pendências.

### Página dedicada — comportamento
- Lista counterparties sem categoria, ordenados por total gasto (descendente)
- Mostra: nome, total gasto, quantidade de transações vinculadas
- **Categorização inline**: multi-select de categorias direto no card/row, sem abrir sheet ou navegar para outra página
- Ao salvar, dispara `cascadeUpdateCounterpartyCategoryIds` existente para atualizar todas as transações vinculadas
- Counterparty sai da lista quando categorizado (feedback visual imediato)

### Dados necessários
- Query counterparties onde `categoryIds` é array vazio
- Cross-reference com transações para calcular total gasto por counterparty (pode usar dados do report `expensesByCounterparty` ou query direta)
