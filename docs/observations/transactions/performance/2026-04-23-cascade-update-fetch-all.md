---
status: open
type: performance
severity: medium
found-during: "Investigacao de fetches desnecessarios sem servidor"
found-in: "src/services/api/sync/cascade-delete-category.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-23
updated: 2026-04-23
resolved-date:
discard-reason:
deferred:
deferred-reason:
related-commits:
related-observations:
  - docs/observations/transactions/performance/2026-04-19-firebase-batch-500-limit.md
  - docs/observations/transactions/performance/2026-04-23-cascade-delete-fetch-all.md
  - docs/observations/reports/bug/2026-04-23-best-effort-report-sync-fragility.md
---

# Cascade updates carregam todas as transacoes afetadas antes de atualizar

## Contexto

Quando o usuario deleta uma categoria, deleta um counterparty, ou edita os `categoryIds` de um counterparty, o sistema precisa propagar a mudanca para todas as transacoes afetadas. As implementacoes atuais:

1. Buscam **todas** as transacoes filtradas (`array-contains` para categoria, `==` para counterparty) com `firebaseList`.
2. Aplicam a transformacao em memoria.
3. Passam o array completo para `firebaseUpdateMany`, que sofre do mesmo problema do batch limit 500.

Para uma categoria muito usada ou um counterparty recorrente, o volume de transacoes afetadas pode passar de 500 e quebrar o batch. Mesmo abaixo de 500, o padrao desperdica memoria e bandwidth.

Especificamente em `cascade-update-counterparty-category-ids`, alem do problema acima, ha uma chamada subsequente a `rebuildReport` por bank account afetada — que por sua vez carrega TODAS as transacoes de cada conta para reconstruir o Report. Cascade dentro de cascade.

## Examples

- Categoria "Alimentacao" usada em 800 transacoes: hoje, `firebaseList` traz 800 docs, batch update tenta 800 ops e quebra no limite de 500.
- Counterparty "Mercado" com 600 transacoes em 2 contas: hoje, traz 600 docs, falha no batch, e ainda dispara 2 `rebuildReport` (cada um trazendo todas as transacoes da respectiva conta).

## Where

- `src/services/api/sync/cascade-delete-category.ts:23-37` — `firebaseList` paralelo (transacoes + counterparties) sem limite
- `src/services/api/sync/cascade-delete-counterparty.ts:18-25` — `firebaseList` sem limite
- `src/services/api/sync/cascade-update-counterparty-category-ids.ts:30-37` — `firebaseList` sem limite
- `src/services/api/sync/cascade-update-counterparty-category-ids.ts:51-65` — `Promise.all` de `rebuildReport` por conta (cada um faz um cascade adicional)
- `src/services/api/reports/rebuild-report.ts:22-26` — `getTransactions` sem filtro

## Por que importa

- **Falha em categorias/counterparties muito usados** — Operacoes de delete/update em entidades populares quebram silenciosamente.
- **Custo amplificado por rebuildReport** — A cada cascade de counterparty, todas as transacoes de cada conta afetada sao carregadas duas vezes (uma pelo cascade, outra pelo rebuild).
- **UX ruim** — Operacao de "deletar categoria" pode levar varios segundos sem feedback claro.

## Suggested approach

Aplicar a mesma estrategia do `cascade-delete-fetch-all`: paginacao + chunked batches.

Para `cascade-update-counterparty-category-ids` adicionalmente:
- Em vez de chamar `rebuildReport` (que recarrega TODAS as transacoes), aplicar deltas direcionados ao Report somente para as transacoes que mudaram. Funcao similar a `applyTransactionToReport` mas que recebe o diff de `categoryIds`.
- Alternativa pragmatica: continuar usando `rebuildReport` por enquanto, tratar essa fragilidade como parte da observation `best-effort-report-sync-fragility`, e priorizar o fix de paginacao do cascade.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Depende de**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md)
- **Mesmo padrao**: [Cascade delete fetch-all](2026-04-23-cascade-delete-fetch-all.md)
- **Relacionado**: [Best-effort report sync fragility](../../reports/bug/2026-04-23-best-effort-report-sync-fragility.md) — `rebuildReport` faz parte do desenho atual de manutencao do Report
