---
status: open
type: performance
severity: high
found-during: "Production testing with 2000+ transactions"
found-in: "src/services/api/transactions/paginate-transactions.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-04-23
resolved-date:
discard-reason:
deferred:
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

Para categorias, o volume e naturalmente pequeno (dezenas) — o antipadrao tem impacto baixo, mas vale aplicar a mesma estrategia se a abordagem com `slugifiedName` for adotada para counterparties.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo contexto (listagem)**: [Paginacao offset](2026-04-19-offset-pagination-degradation.md) — ambos afetam a experiencia de navegar `/transacoes`
- **Mesmo padrao (fetch-all)**:
  - [Dashboard carrega tudo](../../dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md)
  - [get-or-create-counterparty fetch-all](../../counterparties/performance/2026-04-23-get-or-create-counterparty-fetch-all.md) — habilita o fix para search de counterparties
  - [Reference data refetched](../../counterparties/performance/2026-04-23-reference-data-refetched-everywhere.md)
