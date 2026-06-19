---
status: resolved
type: performance
severity: high
found-during: "Production testing with 2000+ transactions"
found-in: "src/services/api/transactions/paginate-transactions.ts"
working-branch: "perf/performance-overview"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-06-19
resolved-date: 2026-06-19
discard-reason:
deferred:
related-commits:
  - 318eec1
---

# Search de transacoes busca toda a colecao para filtrar no client

## O que foi encontrado

Quando o usuario digita algo no campo de busca, `paginateWithSearch()` usa `firebaseList()` que busca **todos** os documentos que atendem aos filtros ativos (sem limite). Depois faz `.filter()`, `.sort()` e `.slice()` no client para aplicar a busca textual e paginacao.

O debounce de 400ms ameniza o problema de multiplas requests, mas cada request ainda baixa todos os documentos.

## Onde

- `src/services/api/transactions/paginate-transactions.ts:72-75` — `firebaseList()` sem paginacao
- `src/services/api/transactions/paginate-transactions.ts:77-80` — filtro client-side por `description.includes(search)`
- `src/services/api/transactions/paginate-transactions.ts:83-93` — sort client-side
- `src/components/Transactions/TransactionListSection.vue` — debounce de 400ms no search input

## Por que importa

- **Lentidao ao buscar**: Com 2000+ transacoes, cada busca baixa todos os documentos do Firebase. Em conexoes lentas, isso pode levar varios segundos.
- **Custo Firebase**: Cada keystroke (apos debounce) = leitura de todos os documentos filtrados.
- **Bloqueio de UI**: O parse e sort de arrays grandes no main thread pode causar jank.

## Abordagem sugerida

Nao existe uma solucao perfeita para busca textual no Firestore (ele nao suporta LIKE/full-text). Opcoes por ordem de complexidade:

**1. Limitar o fetch com filtros obrigatorios (mais simples)**
Exigir que o usuario tenha pelo menos um filtro de data ativo ao buscar, reduzindo o volume de dados:
```ts
// Se tem search mas nenhum filtro de data, aplicar periodo padrao (ex: ultimos 3 meses)
```

**2. Busca por prefixo no Firestore (limitada)**
Firestore suporta `>=` e `<` para simular starts-with, mas nao includes. Util apenas para buscas por inicio de descricao.

**3. Algolia / Typesense / Meilisearch (mais completo)**
Servico externo de full-text search. Adiciona complexidade e custo, mas resolve o problema completamente. Provavelmente overkill para o volume atual.

**Recomendacao pragmatica**: Opcao 1 — garantir que search sempre opere sobre um subset filtrado por data. Se o usuario nao tem filtro de data, aplicar automaticamente um range (ex: ultimos 6 meses). Isso limita o fetch a ~300-500 transacoes em vez de 2000+.

## Antipadrao replicado em outras searches

O mesmo padrao "fetch-all + filter + slice no client" aparece em:
- `src/services/api/counterparties/paginate-counterparties.ts` (search de counterparties)
- `src/services/api/categories/paginate-categories.ts` (search de categorias)

Para counterparties, a observation [get-or-create-counterparty fetch-all](../../counterparties/performance/2026-04-23-get-or-create-counterparty-fetch-all.md) propoe adicionar `slugifiedName` ao schema — o mesmo campo habilita prefix search nativo no Firestore (`where("slugifiedName", ">=", q)` + `where("slugifiedName", "<", q + "")`), eliminando o fetch-all aqui tambem.

> **Status (Onda D, 2026-06-02)**: resolvido por **outra** estrategia que a originalmente proposta. Em vez de prefix search por `slugifiedName`, a busca de terceiros/categorias passou a filtrar o `useReferenceDataStore` **em memoria** (a Onda C ja carrega tudo uma vez) — zero leituras Firebase e mantem substring (`'mercado'` acha `'Supermercado'`), o que o prefix search nao faria. O `slugifiedName` indexado da Onda C permanece justificado por #8 (`getOrCreateCounterparty`).

## Resolution

Resolvido na Onda D (commit `318eec1`), validado pelo usuario:
- **Busca de transacoes (#7 principal)**: quando ha `search` sem filtro de data, injeta janela padrao de **6 meses** (`getDefaultSearchWindow`) antes do fetch — limita o `firebaseList` a ~300-500 docs em vez de toda a base. Substring em `description` segue no client, mas sobre o subconjunto limitado. Filtro de data explicito do usuario e respeitado (sem injecao).
- **Busca de terceiros**: `terceiros/index.vue` deixou de chamar `paginateCounterparties` (fetch-all+substring server) e passou a paginar/filtrar o store em memoria via novo helper `paginateInMemory` — zero leituras.
- **Busca de categorias**: `categorias/index.vue` idem, sobre `categories` do store.
- `paginate-counterparties.ts` / `paginate-categories.ts` ficaram **sem uso pela UI** (marcados; mantidos por causa dos integration tests de indice; remocao e follow-up opcional).

**Verificacao**: testes unit `get-default-search-window.test.ts`, `paginate-in-memory.test.ts` e `paginate-transactions.test.ts` (injecao de janela na busca sem data; respeito a data explicita). `ts-check` limpo; suite verde. Comportamento de busca validado pelo usuario.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo contexto (listagem)**: [Paginacao offset](2026-04-19-offset-pagination-degradation.md) — ambos afetam a experiencia de navegar `/transacoes`
- **Mesmo padrao (fetch-all)**:
  - [Dashboard carrega tudo](../../dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md)
  - [get-or-create-counterparty fetch-all](../../counterparties/performance/2026-04-23-get-or-create-counterparty-fetch-all.md) — habilita o fix para search de counterparties
  - [Reference data refetched](../../counterparties/performance/2026-04-23-reference-data-refetched-everywhere.md)
