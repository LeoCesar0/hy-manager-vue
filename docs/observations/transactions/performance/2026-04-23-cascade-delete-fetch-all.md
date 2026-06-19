---
status: resolved
type: performance
severity: high
retention: reference
found-during: "Investigacao de fetches desnecessarios sem servidor"
found-in: "src/services/api/sync/cascade-delete-bank-account.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-23
updated: 2026-06-19
resolved-date: 2026-06-19
discard-reason:
deferred:
deferred-reason:
related-commits:
  - bc58a55
related-observations:
  - docs/observations/transactions/performance/2026-04-19-firebase-batch-500-limit.md
---

# Cascade delete carrega todas as transacoes em memoria antes de deletar

## Contexto

Quando o usuario deleta uma conta bancaria (`cascadeDeleteBankAccount`) ou usa "limpar transacoes da conta" (`clearBankAccountTransactions`), o sistema:

1. Busca **todas** as transacoes da conta com `firebaseList` (sem limite).
2. Passa o array completo para `firebaseDeleteMany`, que coloca tudo num unico `writeBatch`.

Com 2000+ transacoes, isso significa 2000 docs trazidos para a memoria do browser apenas para extrair os IDs, e um batch que estoura o limite de 500 operacoes do Firestore. A operacao falha silenciosamente ou de forma parcial.

## Examples

Conta com 3000 transacoes:
- **Hoje**: `firebaseList` traz 3000 docs (~3-5 MB de dados desnecessarios — so precisamos dos IDs); `firebaseDeleteMany` quebra no limite de 500 do batch.
- **Apropriado**: paginar 500 IDs por vez, deletar cada chunk em seu proprio batch, avancar via cursor.

## Where

- `src/services/api/sync/cascade-delete-bank-account.ts:18-23` — `firebaseList` sem limite
- `src/services/api/sync/cascade-delete-bank-account.ts:29-33` — `firebaseDeleteMany` com array completo
- `src/services/api/sync/clear-bank-account-transactions.ts:14-26` — mesmo padrao
- `src/services/firebase/firebaseDeleteMany.ts` — sem chunking interno (vide `firebase-batch-500-limit`)

## Por que importa

- **Operacao falha em contas grandes** — O batch de 2000+ deletes estoura silenciosamente o limite de 500 do Firestore.
- **Memoria desnecessaria** — Carregar 2000 docs apenas para extrair IDs e desperdicio de bandwidth e RAM.
- **Sem feedback de progresso** — O usuario nao sabe se a operacao esta avancando, falhou parcialmente, ou completou.

## Suggested approach

Combinar com o fix do batch chunking (`firebase-batch-500-limit`). Em vez de carregar tudo + deletar, paginar e deletar em chunks usando cursor:

```ts
const PAGE_SIZE = 500;
let lastDoc: QueryDocumentSnapshot | null = null;

while (true) {
  const snapshot = await getDocs(query(
    createCollectionRef({ collectionName: "transactions" }),
    where("userId", "==", userId),
    where("bankAccountId", "==", bankAccountId),
    ...(lastDoc ? [startAfter(lastDoc)] : []),
    limit(PAGE_SIZE),
  ));

  if (snapshot.empty) break;

  const batch = writeBatch(firebaseDB);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  lastDoc = snapshot.docs[snapshot.docs.length - 1];
  if (snapshot.docs.length < PAGE_SIZE) break;
}
```

Beneficios:
- Memoria constante O(500) em vez de O(N)
- Cada chunk respeita o limite do Firestore nativamente
- Permite expor progresso ao usuario (X de Y deletados)

A mesma estrategia se aplica a `clear-bank-account-transactions`.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Depende de**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md)
- **Mesmo padrao**: [Cascade update fetch-all](2026-04-23-cascade-update-fetch-all.md)

## Resolution

Resolvido na Onda A do plano de performance (commit `bc58a55`, "feat: performance plan A", merge 2026-06-19). Verificado contra o codigo atual.

O que foi entregue:

- Novo helper `cascadePaginatedBatch` em `src/services/firebase/cascadePaginatedBatch.ts`: pagina via cursor (`orderBy(documentId())` + `startAfter(cursor)` + `limit(pageSize)`, com `pageSize` default = `BATCH_MAX`/500), e para cada pagina cria um `writeBatch`, chama o callback `onPage({ items, batch })` para registrar as operacoes, e faz `commit()` daquele batch. Para quando a pagina retorna menos que `pageSize` docs.
- `cascadeDeleteBankAccount` (`src/services/api/sync/cascade-delete-bank-account.ts`) e `clearBankAccountTransactions` (`src/services/api/sync/clear-bank-account-transactions.ts`) agora usam `cascadePaginatedBatch` com filtros `userId` + `bankAccountId`, deletando cada transacao da pagina via `batch.delete(createDocRef(...))`. Apos a paginacao, deletam o doc de `reports`.

Antes: `firebaseList` sem limite trazia todas as transacoes (O(N) docs em memoria so para extrair IDs) e `firebaseDeleteMany` colocava tudo num unico batch que estourava 500 ops. Depois: memoria constante O(500) por pagina, e cada pagina deleta dentro de seu proprio batch — respeita o limite do Firestore nativamente.

Nota: a atomicidade com o `deleteBankAccount` pai foi explicitamente abandonada acima de 500 ops (documentado por comentario em `cascade-delete-bank-account.ts`); o cascade commita seus proprios batches e o caller cuida do doc pai.

Cobertura: `tests/unit/sync/cascade-delete-bank-account.test.ts`, `tests/unit/sync/clear-bank-account-transactions.test.ts` e `tests/unit/firebase/cascade-paginated-batch.test.ts` (todos no mesmo commit).
