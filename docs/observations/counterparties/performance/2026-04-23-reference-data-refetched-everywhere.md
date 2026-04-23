---
status: open
type: performance
severity: medium
found-during: "Investigacao de fetches desnecessarios sem servidor"
found-in: "src/services/api/categories/get-categories.ts; src/services/api/counterparties/get-counterparties.ts"
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
  - docs/observations/counterparties/performance/2026-04-23-categorization-loads-all-data.md
---

# Categorias e counterparties sao re-baixados a cada navegacao/abertura de form

## Contexto

`getCategories()` e `getCounterparties()` sao chamados em ~10 lugares diferentes (paginas, composables e componentes), cada um com seu proprio `ref` local. Sempre que o usuario:

- Abre o dashboard home → re-baixa
- Vai para `/transacoes` → re-baixa
- Abre o form de transacao → re-baixa
- Abre o detalhe de uma transacao → re-baixa
- Abre o form de counterparty → re-baixa
- Vai para `/terceiros` → re-baixa
- Vai para `/relatorios` → re-baixa
- Etc.

Esses dados sao **referenciais** — mudam pouco em relacao a frequencia com que sao lidos. Categorias variam entre dezenas; counterparties podem chegar a centenas. Em uma sessao tipica de uso (5-10 telas visitadas), isso resulta em 5-10 leituras completas de cada uma das duas colecoes, totalizando facilmente mil+ leituras desnecessarias por sessao.

## Examples

Sessao tipica do usuario com 30 categorias e 200 counterparties:
- Visita 5 telas → 5 × (30 + 200) = 1150 leituras Firebase
- Apropriado com cache: 1 × (30 + 200) = 230 leituras (~5x reducao)
- Apropriado com `onSnapshot`: 230 leituras iniciais + apenas docs alterados em mudancas reais

## Where

Callers de `getCategories()`:
- `src/composables/useDashboardAnalytics.ts:176`
- `src/composables/useReportsAnalytics.ts:257`
- `src/pages/dashboard/transacoes/[id].vue:65`
- `src/pages/dashboard/terceiros/index.vue:74`
- `src/pages/dashboard/terceiros/[id].vue:50`
- `src/pages/dashboard/terceiros/categorizar.vue:227`
- `src/components/Transactions/TransactionForm.vue:70`
- `src/components/Transactions/TransactionListSection.vue:125`
- `src/components/Counterparties/CounterpartyForm.vue:55`

Callers de `getCounterparties()`:
- `src/composables/useDashboardAnalytics.ts:180`
- `src/composables/useReportsAnalytics.ts:261`
- `src/composables/useCounterpartiesCategorization.ts:117`
- `src/pages/dashboard/transacoes/[id].vue:69`
- `src/components/Transactions/TransactionForm.vue:77`
- `src/components/Transactions/TransactionListSection.vue:129`

## Por que importa

- **Custo Firebase cumulativo** — Cada navegacao adiciona dezenas a centenas de leituras evitaveis.
- **Latencia em forms** — Abrir form de transacao espera por 2 fetches em `Promise.all` antes de exibir os selects.
- **Inconsistencia entre tabs/telas** — Como cada componente tem seu proprio `ref`, dados podem divergir entre telas abertas simultaneamente ate um refetch.

## Suggested approach

Centralizar dados referenciais em um Pinia store. Duas opcoes:

### Opcao 1 — Load-once + refresh on mutation (mais simples)

Store `useReferenceDataStore` carrega categorias e counterparties uma vez (apos auth) e expoe getters reativos. Servicos `createCategory`, `updateCategory`, `deleteCategory` (e equivalentes de counterparty) chamam um `refresh()` ou aplicam delta local apos sucesso.

Trade-offs:
- Simples de implementar
- Pode dessincronizar se outro tab editar (sem real-time)
- Refresh manual e suficiente para uso single-tab

### Opcao 2 — `onSnapshot` real-time (mais robusta)

Store assina as colecoes com `onSnapshot()` do Firestore. Reads automaticos apenas quando ha mudancas reais. Sync automatico entre tabs.

Trade-offs:
- Idiomatico no Firebase para "reference data"
- 2 conexoes persistentes (categorias + counterparties)
- Para counterparties com volume grande (1000+), pode pesar — mitigavel limitando a query (ex: apenas counterparties mais recentes/usados)

**Recomendacao**: comecar pela Opcao 1 (mais barata, ganho imediato). Migrar para Opcao 2 se a inconsistencia entre tabs virar um problema real.

Componentes/composables param de chamar `getCategories`/`getCounterparties` diretamente e passam a consumir o store.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Beneficiario direto**: [Categorization composable carrega tudo](2026-04-23-categorization-loads-all-data.md) — outra fonte de leitura de counterparties que se beneficiaria do cache
- **Relacionado (mesmo antipadrao)**: [get-or-create-counterparty fetch-all](2026-04-23-get-or-create-counterparty-fetch-all.md)
