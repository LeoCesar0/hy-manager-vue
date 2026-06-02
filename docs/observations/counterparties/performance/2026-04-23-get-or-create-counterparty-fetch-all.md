---
status: awaiting-validation
type: performance
severity: medium
found-during: "Investigacao de fetches desnecessarios sem servidor"
found-in: "src/services/api/counterparties/get-or-create-counterparty.ts"
working-branch: "perf/performance-overview"
found-in-branch: "main"
date: 2026-04-23
updated: 2026-06-02
resolved-date:
discard-reason:
deferred:
deferred-reason:
related-commits:
related-observations:
  - docs/observations/transactions/performance/2026-04-19-search-full-collection-fetch.md
---

# get-or-create-counterparty busca toda a colecao para encontrar 1 doc

## Contexto

Quando o app cria ou edita uma transacao manualmente (`createTransaction`, `updateTransaction`), ele chama `getOrCreateCounterparty` para garantir que o counterparty informado exista. A implementacao atual baixa **todos os counterparties do usuario** com `firebaseList`, slugifica o nome de cada um no client e procura match com `.find()`.

Para um usuario com 100+ counterparties (caso comum apos importar 3 anos de extrato), cada criacao/edicao de transacao via UI dispara uma leitura completa da colecao `creditors`. E ineficiente em latencia, custa N leituras quando 1 seria suficiente, e replica o antipadrao "busca tudo + filtra no client" que tambem aparece nas searches de transacoes/counterparties/categorias.

## Examples

Usuario com 200 counterparties edita uma transacao mudando o pagador de "Mercado X" para "Padaria Y":
- **Hoje**: 200 leituras Firebase para verificar se "Padaria Y" ja existe.
- **Apropriado**: 1 leitura via query indexada `where("slugifiedName", "==", "padaria-y")`.

Em conexoes lentas, o salvamento da transacao espera essa busca completar antes de prosseguir.

## Where

- `src/services/api/counterparties/get-or-create-counterparty.ts:30-39` — `firebaseList` sem limite
- `src/services/api/counterparties/get-or-create-counterparty.ts:41-43` — match em memoria via `.find()` apos slugificar todos
- Callers:
  - `src/services/api/transactions/create-transaction.ts:32`
  - `src/services/api/transactions/update-transaction.ts:40`

## Por que importa

- **Custo Firebase O(n) por operacao manual** — Cada criacao/edicao de transacao = N leituras de counterparty.
- **Latencia perceptivel em forms** — Em conexoes lentas, salvar uma transacao pode levar segundos so na verificacao do counterparty.
- **Bloqueia melhoria de search** — A search de counterparties (`paginate-counterparties.ts`) sofre do mesmo padrao. Resolver este aqui (com `slugifiedName` indexado) habilita prefix match nativo no Firestore na search.

## Suggested approach

Adicionar campo `slugifiedName` ao schema `ICounterparty`, populado em create/update. Criar indice composto `userId + slugifiedName` no Firestore. Substituir o `firebaseList` + `.find()` por:

```ts
const existingList = await firebaseList<ICounterparty>({
  collection: "creditors",
  filters: [
    { field: "userId", operator: "==", value: userId },
    { field: "slugifiedName", operator: "==", value: slugify(name) },
  ],
});
const existing = existingList[0];
```

**Beneficio adicional**: o mesmo campo habilita prefix search no Firestore para a busca de counterparties (`where("slugifiedName", ">=", q)` + `where("slugifiedName", "<", q + "")`), eliminando o antipadrao de fetch-all em `paginate-counterparties.ts`.

**Migracao**: rodar um one-shot que percorre `creditors` existentes e popula `slugifiedName`, ou usar lazy-fill no proximo update do doc (campo opcional, fallback para slugify do `name` quando ausente).

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo padrao (fetch-all)**: [Search full-fetch](../../transactions/performance/2026-04-19-search-full-collection-fetch.md) — habilita o fix da search de counterparties
- **Mesmo padrao (referencias re-baixadas)**: [Reference data refetched](2026-04-23-reference-data-refetched-everywhere.md)

## Pending Validation

**Feito (Onda C, branch `perf/performance-overview`, 2026-06-02)**:
- `slugifiedName: z.string()` adicionado ao schema persistido `zCounterparty` (so no doc armazenado; tipos de input nao o carregam — services injetam). Populado em `create-counterparty`, `update-counterparty` (recomputa no rename) e no bulk do import.
- `getOrCreateCounterparty` agora faz `firebaseList` com filtros `userId ==` + `slugifiedName ==` (1 doc), em vez de baixar tudo e `.find()`.
- Indice composto `creditors: userId + slugifiedName` adicionado a `firestore.indexes.json`.
- Migracao one-shot `migrate-counterparty-slugified-name.ts` awaited em `auth.global.ts` faz backfill dos docs existentes (idempotente, marca `user.migrations.counterpartySlug`).

**Verificado em sessao**: testes unit `get-or-create-counterparty.test.ts` (filtro slugifiedName + 1 query; create no miss) e `migrate-counterparty-slugified-name.test.ts` (backfill so dos faltantes, idempotente, marca user, nunca throw). `ts-check` limpo.

**Falta (usuario)**: **deploy do indice** (`pnpm deploy:indexes`) antes do teste valendo — sem ele a query falha com "index required". Depois, validar create/edit de transacao com counterparty em volume real (1 leitura vs N). Nao commitado.

> **Prefix search de counterparties (#7) ADIADO para a Onda D.** O `slugifiedName` indexado entregue aqui e o groundwork; o refactor de `paginate-counterparties` (fetch-all+substring → range query prefix) acontece na D junto com a paginacao de transacoes.
