---
status: open
type: performance
severity: high
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

# Import cria counterparties uma a uma em loop sequencial

## O que foi encontrado

`resolveCounterparties()` no fluxo de import cria cada counterparty novo com um `await createCounterparty()` sequencial dentro de um loop `for...of`. Cada chamada faz uma escrita individual no Firestore via `handleAppRequest`.

Com um extrato bancario de 3 anos, pode haver dezenas ou centenas de counterparties unicos novos. Se o extrato tem 100 nomes novos, sao 100 requests sequenciais ao Firebase.

## Onde

- `src/services/api/transactions/import-transactions.ts:168-193` — loop `for (const name of uniqueNewNames)` com `await createCounterparty()` individual

## Por que importa

- **Import lento**: Cada counterparty novo adiciona ~100-300ms de latencia (round-trip ao Firestore). 100 counterparties novos = 10-30 segundos so na criacao de counterparties, antes mesmo de criar as transacoes.
- **UX de import**: O usuario ve "Importando transacoes..." por um tempo longo sem entender por que demora.

## Abordagem sugerida

Usar `firebaseCreateMany` para criar todos os counterparties de uma vez em batch:

```ts
const newCounterparties = uniqueNewNames.map((name) => ({
  name: name.trim(),
  userId,
  categoryIds: resolveAutoCategoryId({
    counterpartyName: name,
    userCategories,
    enableKeywordMatch: selfDerivedNames.has(slugify(name)),
  }),
}));

const created = await firebaseCreateMany<typeof newCounterparties[number], ICounterparty>({
  collection: "creditors",
  data: newCounterparties,
});

for (const cp of created) {
  counterpartyMap.set(slugify(cp.name), cp);
}
```

**Dependencia**: Este fix depende de resolver o problema do batch limit de 500 (`2026-04-19-firebase-batch-500-limit.md`) primeiro, ja que `firebaseCreateMany` precisa do chunking para funcionar com qualquer quantidade.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Depende de**: [Batch limit 500](2026-04-19-firebase-batch-500-limit.md) — `firebaseCreateMany` precisa do chunking antes de ser usado aqui
- **Mesmo fluxo (import)**: [Deduplicacao pesada no import](2026-04-19-import-deduplication-heavy-queries.md) — ambos tornam o import lento juntos
