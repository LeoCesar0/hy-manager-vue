---
status: awaiting-validation
type: performance
severity: critical
found-during: "Production testing with 2000+ transactions"
found-in: "src/services/firebase/firebasePaginatedList.ts"
working-branch: "perf/performance-overview"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-06-02
resolved-date:
discard-reason:
deferred:
---

# Paginacao offset-based busca page*limit documentos do Firebase

## O que foi encontrado

`firebasePaginatedList` implementa paginacao por offset: busca `page * limit` documentos do Firestore e descarta os anteriores com `.slice()` no client. A performance degrada linearmente conforme o usuario avanca nas paginas.

Exemplo concreto com 2000 transacoes e limit=20:
- Pagina 1: busca 20 docs, mostra 20
- Pagina 10: busca 200 docs, mostra 20
- Pagina 50: busca 1000 docs, mostra 20
- Pagina 100: busca 2000 docs, mostra 20

Cada documento transferido consome bandwidth e e cobrado como leitura no Firestore.

## Onde

- `src/services/firebase/firebasePaginatedList.ts:48` — `limit(pagination.page * pagination.limit)`
- `src/services/firebase/firebasePaginatedList.ts:54-57` — `.slice(docsToSkip)` descarta documentos ja buscados

## Por que importa

- **Lentidao progressiva**: Navegar para paginas mais distantes fica cada vez mais lento. Com 2000+ transacoes, as ultimas paginas levam segundos para carregar.
- **Custo Firebase**: Cada navegacao de pagina conta como N leituras, nao apenas as 20 que o usuario ve.
- **UX**: O usuario percebe travadas ao navegar, especialmente em mobile.

## Abordagem sugerida

Implementar cursor-based pagination usando `startAfter()` do Firestore:

```ts
// Guardar o ultimo documento da pagina atual
const lastDoc = dataSnapshot.docs[dataSnapshot.docs.length - 1];

// Na proxima pagina, comecar a partir dele
getDocs(query(baseQuery, startAfter(lastDoc), limit(pagination.limit)))
```

Consideracoes:
- Requer cache do ultimo documento de cada pagina visitada para suportar navegacao para tras
- `getCountFromServer()` ja e usado para o total — pode ser mantido
- Alternativa mais simples: limitar a paginacao a "anterior/proximo" sem pulo de paginas (simplifica a implementacao)
- A UI de paginacao (`src/components/Table/Pagination.vue`) pode precisar adaptar para nao permitir pulo direto para paginas distantes

## Pending Validation

**Feito (Onda D, branch `perf/performance-overview`, 2026-06-02)** — adotada paginacao cursor (Next/Previous apenas, sem page-jump):
- Novo `src/services/firebase/firebaseCursorList.ts`: busca `limit + 1` docs para detectar `hasNext` sem segunda query, aplica `startAfter(cursor)` e retorna o ultimo doc da pagina como cursor para a proxima. `count` via `getCountFromServer` (opcional, `withCount`).
- `paginate-transactions.ts` (modo browse, sem busca) passa a usar `firebaseCursorList` em vez de `firebasePaginatedList` (offset). Retorno unificado `ICursorPaginationResult` (`{ list, count, hasNext, cursor }`).
- `TransactionListSection.vue`: maquina de estados de cursor (`cursorStack` indexado por pagina, `goNext`/`goPrev`/`reload`); novo componente `Table/CursorPagination.vue` (Prev/Next + "Mostrando X–Y de N"). **Page nao e mais sincronizada na URL** (cursor nao e restauravel de query param) — refresh volta para a pagina 1 (aceito).
- **Nenhum indice Firestore novo**: os indices compostos de transacoes ja tem `__name__` como sort final, entao `startAfter(docSnapshot)` e estavel. NAO requer `pnpm deploy:indexes`.
- `firebasePaginatedList` permanece (ainda usado por `get-bank-accounts`).

**Verificado em sessao**: testes unit `firebase-cursor-list.test.ts` (limit+1, hasNext/trim, cursor, withCount) e `paginate-transactions.test.ts` (browse delega ao cursor e repassa o cursor). `ts-check` limpo; suite unit sem regressao.

**Falta (usuario / manual)**: navegar `/transacoes` com volume real e confirmar Next/Prev sem degradar nas paginas fundas, label de range correto, e reset para pagina 1 ao trocar filtros/conta/sort/page-size. Nao verificavel em teste node. Nao commitado.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo contexto (listagem)**: [Search full-fetch](2026-04-19-search-full-collection-fetch.md) — ambos afetam a experiencia de navegar `/transacoes`
- **Volume causado por**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md) — se o import funcionar bem, o volume cresce e agrava este problema
