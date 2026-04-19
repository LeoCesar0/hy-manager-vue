---
status: open
type: performance
severity: critical
found-during: "Production testing with 2000+ transactions"
found-in: "src/services/firebase/firebasePaginatedList.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-04-19
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

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo contexto (listagem)**: [Search full-fetch](2026-04-19-search-full-collection-fetch.md) — ambos afetam a experiencia de navegar `/transacoes`
- **Volume causado por**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md) — se o import funcionar bem, o volume cresce e agrava este problema
