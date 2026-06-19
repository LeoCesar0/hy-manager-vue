---
status: resolved
type: performance
severity: critical
retention: reference
found-during: "Production testing with 2000+ transactions import"
found-in: "src/services/firebase/firebaseCreateMany.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-06-19
resolved-date: 2026-06-19
discard-reason:
deferred:
related-commits:
  - bc58a55
---

# firebaseCreateMany ignora limite de 500 operacoes por batch do Firestore

## O que foi encontrado

`firebaseCreateMany` coloca todos os documentos num unico `writeBatch` e faz `commit()`. O Firestore tem um limite hard de **500 operacoes por batch**. Ao importar um extrato com mais de 500 transacoes, o batch estoura o limite e falha ou apresenta comportamento imprevisivel.

O mesmo problema existe em `firebaseUpdateMany` e `firebaseDeleteMany`.

## Onde

- `src/services/firebase/firebaseCreateMany.ts:29-43` — loop que adiciona todos os itens ao batch sem chunking
- `src/services/firebase/firebaseUpdateMany.ts` — mesmo padrao
- `src/services/firebase/firebaseDeleteMany.ts` — mesmo padrao

## Por que importa

- **Import quebra silenciosamente**: Com 2000+ transacoes de um extrato de 3 anos, o commit falha. O usuario nao recebe feedback claro do que aconteceu.
- **Cascading deletes tambem afetadas**: `cascade-delete-bank-account` e `clear-bank-account-transactions` usam `firebaseDeleteMany` — ao deletar uma conta com 500+ transacoes, o batch estoura.
- **Limite do Firestore e documentado**: https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes

## Abordagem sugerida

Chunkar os dados em blocos de no maximo 500 antes de commitar:

```ts
const FIRESTORE_BATCH_LIMIT = 500;

const chunks = chunk({ items: data, size: FIRESTORE_BATCH_LIMIT });

for (const chunkData of chunks) {
  const batch = writeBatch(firebaseDB);
  for (const item of chunkData) {
    // ... set/update/delete no batch
  }
  await batch.commit();
}
```

Aplicar em `firebaseCreateMany`, `firebaseUpdateMany` e `firebaseDeleteMany`. O helper `chunk()` ja existe em `src/helpers/chunk.ts`.

Quando um `batch` externo e passado via parametro, o caller assume a responsabilidade de respeitar o limite — documentar isso no tipo.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Depende deste fix**:
  - [Import cria counterparties uma a uma](2026-04-19-import-sequential-counterparty-creation.md) — usaria `firebaseCreateMany` apos este fix
  - [Cascade delete fetch-all](2026-04-23-cascade-delete-fetch-all.md) — `firebaseDeleteMany` em cascade ops sofre do mesmo limite
  - [Cascade update fetch-all](2026-04-23-cascade-update-fetch-all.md) — `firebaseUpdateMany` em cascade ops sofre do mesmo limite
- **Mesmo fluxo (import)**: [Deduplicacao pesada no import](2026-04-19-import-deduplication-heavy-queries.md)

## Resolution

Resolvido na Onda A do plano de performance (commit `bc58a55`, "feat: performance plan A", merge 2026-06-19). Verificado contra o codigo atual.

O que foi entregue:

- Constante `BATCH_MAX = 500` em `src/services/firebase/@constants.ts`.
- `firebaseCreateMany`, `firebaseUpdateMany` e `firebaseDeleteMany` agora chunkam os documentos via `chunk({ items, size: BATCH_MAX })` (`src/helpers/chunk.ts`) e commitam um `writeBatch` por chunk. Cada batch respeita nativamente o limite de 500 operacoes do Firestore.
- Quando um `batch` externo e passado via parametro, as tres funcoes **nao** chunkam nem commitam — o caller assume o budget de 500 ops. Isso esta documentado por comentario em cada arquivo (`// External batch → caller owns the 500-op budget; do not chunk, do not commit.`).

Antes: todos os docs num unico `writeBatch` → commit estourava acima de 500 ops. Depois: O(N/500) batches sequenciais, cada um dentro do limite.

Cobertura: `tests/integration/firebase/firebase-many-chunking.integration.test.ts` (introduzido no mesmo commit) valida o chunking das tres operacoes.
