---
status: resolved
type: performance
severity: medium
found-during: "Investigacao de fetches desnecessarios sem servidor"
found-in: "src/services/api/sync/cascade-delete-category.ts"
working-branch: "perf/performance-overview"
found-in-branch: "main"
date: 2026-04-23
updated: 2026-06-19
resolved-date: 2026-06-19
discard-reason:
deferred:
deferred-reason:
related-commits:
  - bc58a55
  - c820426
related-observations:
  - docs/observations/transactions/performance/2026-04-19-firebase-batch-500-limit.md
  - docs/observations/transactions/performance/2026-04-23-cascade-delete-fetch-all.md
  - docs/observations/reports/bug/2026-04-23-best-effort-report-sync-fragility.md
  - docs/observations/counterparties/performance/2026-06-16-categorizar-save-freeze.html
---

# Cascade updates carregam todas as transacoes afetadas antes de atualizar

## Contexto

Quando o usuario deleta uma categoria, deleta um counterparty, ou edita os `categoryIds` de um counterparty, o sistema precisa propagar a mudanca para todas as transacoes afetadas. As implementacoes atuais:

1. Buscam **todas** as transacoes filtradas (`array-contains` para categoria, `==` para counterparty) com `firebaseList`.
2. Aplicam a transformacao em memoria.
3. Passam o array completo para `firebaseUpdateMany`, que sofre do mesmo problema do batch limit 500.

Para uma categoria muito usada ou um counterparty recorrente, o volume de transacoes afetadas pode passar de 500 e quebrar o batch. Mesmo abaixo de 500, o padrao desperdica memoria e bandwidth.

Especificamente em `cascade-update-counterparty-category-ids`, alem do problema acima, ha uma chamada subsequente a `rebuildReport` por bank account afetada — que por sua vez carrega TODAS as transacoes de cada conta para reconstruir o Report. Cascade dentro de cascade.

### Confirmado em producao (2026-06-16) — freeze ao salvar na tela Categorizar

Apos o deploy da Onda D, esse caminho produziu um **freeze critico observado em producao** na tela `dashboard/terceiros/categorizar/`. Duas agravantes runtime, nao capturadas na descricao original acima, foram identificadas e estao detalhadas na observation dedicada [categorizar-save-freeze](../../counterparties/performance/2026-06-16-categorizar-save-freeze.html):

1. **Cascade fire-and-forget** — em `update-counterparty.ts:45-52`, `cascadeUpdateCounterpartyCategoryIds` e chamado **sem `await`**. `updateCounterparty` retorna antes do trabalho pesado; o `Promise.allSettled` da pagina resolve, o toast "salvo" aparece, e so entao o cascade satura o navegador. Por isso o travamento acontece *depois* do toast e sem nenhum feedback de "processando".
2. **Amplificacao N-paralela** — `handleSaveAll` salva N identificadores em paralelo, disparando N cascades simultaneos. Como nao ha dedup entre eles, varias contas em comum tem `rebuildReport` rodando concorrentemente, cada execucao relendo toda a base de transacoes da conta e refazendo o `reduce` sincrono. A mesma conta e reconstruida varias vezes ao mesmo tempo.

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
- **Deduplicar `rebuildReport` por conta no save em lote** — coletar as contas afetadas por todos os identificadores salvos e reconstruir cada conta uma unica vez, em vez de uma vez por cascade concorrente (ver [categorizar-save-freeze](../../counterparties/performance/2026-06-16-categorizar-save-freeze.html)).
- **Resolver o cascade fire-and-forget** — em `update-counterparty.ts`, o cascade roda sem `await` e sem feedback; decidir entre await com estado de "sincronizando" na UI ou execucao em background explicitamente fora do main thread (detalhado na obs do freeze).
- Alternativa pragmatica: continuar usando `rebuildReport` por enquanto, tratar essa fragilidade como parte da observation `best-effort-report-sync-fragility`, e priorizar o fix de paginacao do cascade.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Depende de**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md)
- **Mesmo padrao**: [Cascade delete fetch-all](2026-04-23-cascade-delete-fetch-all.md)
- **Relacionado**: [Best-effort report sync fragility](../../reports/bug/2026-04-23-best-effort-report-sync-fragility.md) — `rebuildReport` faz parte do desenho atual de manutencao do Report

## Resolution

Resolvido entre a Onda A (commit `bc58a55`) e o fix do freeze em producao (commit `c820426`), validado pelo usuario. Os quatro pontos do problema estao cobertos no codigo:

1. **Batch chunkado (limite 500)** — `firebaseUpdateMany` quebra os updates em chunks de `BATCH_MAX = 500` (`firebaseUpdateMany.ts`), eliminando o estouro silencioso do batch para categorias/counterparties muito usados.
2. **Fetch paginado por cursor** — `cascade-update-counterparty-category-ids` busca as transacoes afetadas via `cascadePaginatedBatch` (`startAfter` + `limit(500)`) em vez de `firebaseList` sem limite.
3. **Dedup de `rebuildReport` no save em lote** — `bulkUpdateCounterpartyCategories` coleta as contas afetadas por todos os identificadores num `Set` e reconstroi cada conta **uma unica vez, sequencialmente**, em vez de N rebuilds concorrentes. A tela `categorizar.vue` passou a usar esse service em vez de N `updateCounterparty` paralelos.
4. **Cascade awaited (fim do fire-and-forget)** — `update-counterparty.ts` agora faz `await cascadeUpdateCounterpartyCategoryIds(...)`; a funcao so retorna apos o trabalho pesado, e os rebuilds rodam sequencialmente.

As agravantes runtime do freeze em producao estao detalhadas e resolvidas na observation irma [categorizar-save-freeze](../../counterparties/performance/2026-06-16-categorizar-save-freeze.html) (ja resolvida).

**Verificacao**: testes unit de `bulk-update-counterparty-categories`, `cascade-update-counterparty-category-ids` e `cascade-paginated-batch` verdes; `ts-check` limpo; suite verde. Comportamento de salvar na tela Categorizar sem freeze validado pelo usuario em producao.
