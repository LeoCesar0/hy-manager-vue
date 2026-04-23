---
status: open
type: performance
severity: medium
found-during: "Investigacao de fetches desnecessarios sem servidor"
found-in: "src/composables/useCounterpartiesCategorization.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-23
updated: 2026-04-23
resolved-date:
discard-reason:
deferred:
deferred-reason:
related-commits:
related-observations:
  - docs/observations/dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md
---

# Composable de categorizacao carrega TODAS as transacoes do usuario

## Contexto

`useCounterpartiesCategorization` e usado em 3 lugares:
1. **Dashboard home** (`pages/dashboard/index.vue:36`) — apenas para mostrar `uncategorizedCount`
2. **Lista de terceiros** (`pages/dashboard/terceiros/index.vue:28`) — mesma contagem
3. **Tela de categorizar** (`pages/dashboard/terceiros/categorizar.vue:30`) — usa stats e transacoes por counterparty

Em qualquer um desses 3 contextos, o composable carrega **TODAS as counterparties + TODAS as transacoes do usuario** sem filtro. As stats (totais e contagens por counterparty) sao construidas em memoria iterando sobre todas as transacoes via `buildItems`.

Com 2000+ transacoes, isso significa que abrir o dashboard home (que so precisa de um numero) dispara o download de toda a base de transacoes do usuario.

## Examples

- **Dashboard home**: usuario quer apenas ver `uncategorizedCount: 12` no header. App baixa 2000 transacoes + 200 counterparties para calcular esse numero.
- **Tela de categorizar**: usuario quer revisar 12 counterparties sem categoria. App baixa todas as 2000 transacoes para calcular stats que so afetam esses 12.

## Where

- `src/composables/useCounterpartiesCategorization.ts:116-125` — `Promise.all` de `getCounterparties()` + `getTransactions()` ambos sem filtro
- `src/composables/useCounterpartiesCategorization.ts:32-74` — `buildItems` itera sobre todas as transacoes para agrupar por counterparty
- Callers:
  - `src/pages/dashboard/index.vue:36`
  - `src/pages/dashboard/terceiros/index.vue:28`
  - `src/pages/dashboard/terceiros/categorizar.vue:30`

## Por que importa

- **Custo Firebase desproporcional** — Abrir o dashboard home faz uma leitura de toda a colecao de transacoes apenas para um contador.
- **Tempo de carregamento** — 2000+ docs no main thread bloqueiam a UI por segundos.
- **Dois consumidores muito diferentes usando o mesmo composable** — O contador (dashboard/terceiros home) tem necessidade trivial; a tela de categorizar precisa de stats. Compartilhar o mesmo loader penaliza o caso simples.

## Suggested approach

**Separar os dois casos de uso**:

1. **Para `uncategorizedCount` (dashboard home + terceiros home)** — usar `getCountFromServer()` do Firestore com filtro de counterparties sem categoria. Uma unica leitura agregada, custo minimo:

```ts
const q = query(
  createCollectionRef({ collectionName: "creditors" }),
  where("userId", "==", userId),
  where("categoryIds", "==", []),
);
const count = (await getCountFromServer(q)).data().count;
```

Nao precisa baixar transacoes.

2. **Para a tela de categorizar** — investigar se realmente precisa das transacoes brutas ou se as stats podem vir do Report pre-agregado (campos como `expensesByCounterpartyCount`, `expensesByCounterparty` por mes, recentemente enriquecidos no commit `bc89da5`). Provavelmente o Report ja tem o suficiente.

3. **Se ainda precisar de transacoes brutas para casos especificos** — limitar por janela de tempo (ex: ultimos 6 meses) ou carregar sob demanda quando o usuario abrir o detalhe de um counterparty especifico.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo padrao (fetch-all transacoes)**: [Dashboard carrega tudo](../../dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md)
- **Habilita uso do Report**: depende dos mesmos campos investigados em [Best-effort report sync fragility](../../reports/bug/2026-04-23-best-effort-report-sync-fragility.md)
- **Reduz contagem de fetches**: [Reference data refetched](2026-04-23-reference-data-refetched-everywhere.md) — counterparties carregadas aqui se beneficiariam do cache
