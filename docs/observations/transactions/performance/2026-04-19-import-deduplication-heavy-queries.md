---
status: open
type: performance
severity: medium
found-during: "Production testing with 2000+ transactions import"
found-in: "src/services/api/transactions/import-transactions.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-04-19
resolved-date:
discard-reason:
deferred:
---

# Deduplicacao no import faz muitas queries paralelas ao Firebase

## O que foi encontrado

`checkExistingTransactions()` no fluxo de import faz deduplicacao em dois passos:

**Passo 1 — Check por ID**: Divide os IDs em chunks de 30 (limite do operador `in` do Firestore) e faz queries paralelas. Com 2000 transacoes no extrato, sao `ceil(2000/30) = 67` queries paralelas, cada uma passando por `getTransactions()` → `handleAppRequest()`.

**Passo 2 — Fallback por campos**: Se ainda ha rows nao matcheadas, faz `firebaseList()` com filtro de date range para buscar transacoes existentes no periodo. Com 2000+ transacoes ja importadas, pode trazer centenas de documentos.

## Onde

- `src/services/api/transactions/import-transactions.ts:62-75` — 67+ queries paralelas via `Promise.all`
- `src/services/api/transactions/import-transactions.ts:97-105` — `firebaseList()` buscando todas transacoes no date range
- `src/services/api/transactions/import-transactions.ts:109-135` — iteracao client-side para matching por campos

## Por que importa

- **Import lento na re-importacao**: Ao re-importar o mesmo extrato (caso comum ao testar), o passo 1 faz 67+ queries simultaneas. Mesmo sendo paralelas, o overhead e significativo.
- **Custo Firebase**: 67 queries × 30 docs = potencialmente 2000 leituras so no check de duplicatas.
- **Segundo passo amplifica**: Se muitas rows nao tem match por ID (retrocompatibilidade), o passo 2 busca tudo no range de datas.

## Abordagem sugerida

**Opcao 1 — Query unica por date range (mais simples)**
Em vez de checar por ID em chunks de 30, buscar todas as transacoes existentes no date range do extrato de uma vez (similar ao passo 2). Depois fazer o matching por ID e por campos em memoria:

```ts
const minDate = Math.min(...rows.map(r => r.date.getTime()));
const maxDate = Math.max(...rows.map(r => r.date.getTime()));

const existing = await firebaseList<ITransaction>({
  collection: "transactions",
  filters: [
    { field: "userId", operator: "==", value: userId },
    { field: "bankAccountId", operator: "==", value: bankAccountId },
    { field: "date", operator: ">=", value: Timestamp.fromDate(new Date(minDate)) },
    { field: "date", operator: "<=", value: Timestamp.fromDate(new Date(maxDate)) },
  ],
});

const existingById = new Set(existing.map(t => t.id));
// ... match por ID e por campos em memoria
```

Isso substitui 67+ queries por 1 unica query. O trade-off e que pode trazer mais documentos do que o necessario (todas as transacoes no periodo, nao so as que matcham por ID), mas para 2000 transacoes o volume e gerenciavel.

**Opcao 2 — Cache local de IDs importados**
Manter um Set de IDs ja importados no client durante a sessao, evitando re-queries ao Firebase para re-importacoes consecutivas. Util para o cenario de teste do usuario.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo fluxo (import)**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md) — ambos afetam o fluxo de import
- **Mesmo fluxo (import)**: [Counterparties sequenciais](2026-04-19-import-sequential-counterparty-creation.md) — os 3 problemas de import se somam na percepcao de lentidao
