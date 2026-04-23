---
status: open
type: performance
severity: critical
date: 2026-04-19
updated: 2026-04-23
---

# Performance: travamento com volume real de dados (2000+ transacoes)

## Contexto real

Ao testar o app em producao pela primeira vez com dados reais — extrato bancario dos ultimos 3 anos, mais de 2000 transacoes — o app apresentou lentidao severa e travadas visiveis na UI. O problema nao era perceptivel em desenvolvimento porque os testes usavam volumes pequenos (dezenas de transacoes).

Esse cenario expoe um padrao comum: **o app foi construido assumindo volumes pequenos em todas as camadas**. Nao ha um unico culpado — sao multiplos problemas independentes que se amplificam mutuamente quando o volume de dados cresce.

A investigacao subsequente (em `2026-04-23`) confirmou que **todos os fixes podem ser feitos sem servidor proprio nem Cloud Functions**. O app permanece SPA puro (Firebase Hosting + Firebase SDK no client). Cada camada precisa apenas adotar os recursos nativos do Firebase de forma apropriada: paginacao com cursor, queries indexadas, `getCountFromServer`, `onSnapshot` para reference data, batches chunkados.

## Mapa dos problemas

11 problemas independentes catalogados, organizados pelo fluxo do usuario que os expoe. Mais 1 fragilidade transversal (deferida).

### Fluxo 1: Import do extrato

| # | Problema | Severidade |
|---|----------|------------|
| 1 | [Batch limit 500 do Firestore](transactions/performance/2026-04-19-firebase-batch-500-limit.md) | critical |
| 2 | [Counterparties criadas sequencialmente](transactions/performance/2026-04-19-import-sequential-counterparty-creation.md) | high |
| 3 | [Deduplicacao com 67+ queries paralelas](transactions/performance/2026-04-19-import-deduplication-heavy-queries.md) | medium |

### Fluxo 2: Dashboard

| # | Problema | Severidade |
|---|----------|------------|
| 4 | [Dashboard carrega todas transacoes brutas](dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md) | critical |
| 5 | [Composable de categorizacao carrega tudo](counterparties/performance/2026-04-23-categorization-loads-all-data.md) | medium |

### Fluxo 3: Listagem de transacoes

| # | Problema | Severidade |
|---|----------|------------|
| 6 | [Paginacao offset (page*limit docs)](transactions/performance/2026-04-19-offset-pagination-degradation.md) | critical |
| 7 | [Search faz fetch-all + filter no client](transactions/performance/2026-04-19-search-full-collection-fetch.md) | high |

### Fluxo 4: Operacoes manuais (CRUD)

| # | Problema | Severidade |
|---|----------|------------|
| 8 | [get-or-create-counterparty busca tudo](counterparties/performance/2026-04-23-get-or-create-counterparty-fetch-all.md) | medium |
| 9 | [Cascade delete carrega tudo antes de deletar](transactions/performance/2026-04-23-cascade-delete-fetch-all.md) | high |
| 10 | [Cascade update carrega tudo antes de atualizar](transactions/performance/2026-04-23-cascade-update-fetch-all.md) | medium |

### Transversal: leituras repetidas

| # | Problema | Severidade |
|---|----------|------------|
| 11 | [Categorias e counterparties re-baixados em ~10 lugares](counterparties/performance/2026-04-23-reference-data-refetched-everywhere.md) | medium |

### Fragilidade transversal (deferida)

| # | Problema | Status |
|---|----------|--------|
| 12 | [Sync best-effort do Report (catch silencioso, race condition, sem auto-heal)](reports/bug/2026-04-23-best-effort-report-sync-fragility.md) | deferred |

A fragilidade #12 e prerequisito de robustez para o fix de #4 (Dashboard via Report pre-agregado), mas o usuario optou por adia-la. Manter no radar.

## Jornada do usuario que expoe os problemas

### Fase 1: Import do extrato
O usuario faz upload do CSV com 2000+ transacoes. Tres problemas atuam juntos:

1. **Deduplicacao pesada** (#3) — 67+ queries paralelas para checar duplicatas por ID, fallback que busca todas as transacoes do periodo.
2. **Counterparties sequenciais** (#2) — Cada nome novo de pagador/recebedor gera um request individual ao Firebase. 100 nomes = 100 round-trips sequenciais.
3. **Batch sem limite de 500** (#1) — As 2000 transacoes sao colocadas num unico `writeBatch`. Estoura o limite de 500 ops do Firestore, falha silenciosamente ou de forma parcial.

**Efeito combinado**: O usuario ve "Importando transacoes..." por tempo indeterminado. Pode falhar sem explicacao clara.

### Fase 2: Navegacao no dashboard
Apos o import, o usuario vai para a dashboard home. Dois problemas atuam:

4. **Dashboard carrega tudo** (#4) — `getTransactions()` busca todas as transacoes do periodo filtrado e processa client-side em 6+ computeds encadeadas. UI trava enquanto processa.
5. **Categorization composable** (#5) — Em paralelo, `useCounterpartiesCategorization` (usado apenas para mostrar `uncategorizedCount` no header) baixa TODAS as transacoes + counterparties do usuario.

**Efeito combinado**: Abrir o dashboard dispara duas leituras gigantes da colecao de transacoes — uma para os cards/charts, outra so para um contador.

### Fase 3: Listagem de transacoes
O usuario navega para `/transacoes`. Dois problemas atuam:

6. **Paginacao offset** (#6) — Busca `page * limit` documentos e descarta os anteriores com `.slice()`. Pagina 50 = busca 1000 docs para mostrar 20.
7. **Search full-fetch** (#7) — Cada keystroke (apos debounce) baixa todos os documentos filtrados para fazer `.includes()` no client.

**Efeito combinado**: Primeiras paginas carregam normalmente, mas degrada conforme o usuario avanca. Search e especialmente lenta. O mesmo antipadrao da search aparece em `paginate-counterparties` e `paginate-categories`.

### Fase 4: Edicao manual de transacoes/categorias/counterparties
O usuario edita uma transacao, deleta uma categoria muito usada, ou apaga uma conta inteira. Tres problemas atuam:

8. **get-or-create-counterparty** (#8) — Salvar uma transacao com novo counterparty baixa toda a colecao de counterparties para verificar duplicidade.
9. **Cascade delete** (#9) — Deletar uma conta com 2000 transacoes carrega todas em memoria e tenta um batch unico que estoura o limite de 500.
10. **Cascade update** (#10) — Deletar uma categoria muito usada (800 transacoes) tenta atualizar todas num batch unico. Em counterparties, `cascade-update-counterparty-category-ids` ainda dispara `rebuildReport` que recarrega todas as transacoes da conta.

**Efeito combinado**: Operacoes que parecem simples (deletar uma categoria) podem travar a UI por segundos e falhar silenciosamente.

### Transversal: navegacao geral
Em qualquer fluxo, o usuario disparara N leituras das colecoes de referencia:

11. **Reference data refetched** (#11) — `getCategories()` e `getCounterparties()` sao chamados em ~10 lugares. Em uma sessao tipica de 5-10 telas, sao mil+ leituras desnecessarias dessas duas colecoes.

## Grafo de dependencias

```
[#1] Batch limit 500 (foundation)
 ^
 |- [#2] Counterparties sequenciais   (usa firebaseCreateMany apos #1)
 |- [#9] Cascade delete fetch-all     (usa firebaseDeleteMany chunked apos #1)
 |- [#10] Cascade update fetch-all    (usa firebaseUpdateMany chunked apos #1)

[#8] get-or-create-counterparty fetch-all
 ^
 |- habilita prefix search nativo => mitiga search de counterparties (parte de #7)

[#11] Reference data refetched
 ^
 |- beneficia: #4 (dashboard), #5 (categorization), #8 (get-or-create), forms diversos

[#4] Dashboard carrega tudo
 ^
 |- depende de robustez do Report => #12 (deferred)

[#3] Deduplicacao pesada       — independente
[#5] Categorization composable — independente (com sinergia com #11 e Report)
[#6] Paginacao offset          — independente
[#7] Search full-fetch         — independente
```

## Ordem sugerida de resolucao

| Ordem | # | Problema | Motivo |
|-------|---|----------|--------|
| 1 | #1 | Batch limit 500 | Foundation: corrige bug real e desbloqueia #2, #9, #10 |
| 2 | #2 | Counterparties sequenciais | Quick win apos #1, ganho perceptivel imediato no import |
| 3 | #9 | Cascade delete fetch-all | Aplica chunked-paging — padrao reusavel para #10 |
| 4 | #10 | Cascade update fetch-all | Mesmo padrao de #9 |
| 5 | #11 | Reference data cache | Reduz centenas de leituras em todos os fluxos; barato |
| 6 | #8 | get-or-create-counterparty | Adiciona `slugifiedName` indexado; tambem mitiga search de counterparties |
| 7 | #5 | Categorization composable | Separa contagem (getCountFromServer) do load completo |
| 8 | #3 | Deduplicacao no import | Substitui 67+ queries por 1 query por date range |
| 9 | #6 | Paginacao offset | Cursor-based pagination — mudanca estrutural |
| 10 | #7 | Search full-fetch | Filtro de data obrigatorio + prefix match onde aplicavel |
| 11 | #4 | Dashboard via Report | Depende de robustez (#12); maior impacto na UX diaria |

**Marco intermediario apos passos 1-4**: o fluxo de Import e as operacoes de cleanup (Cascade) estao saudaveis. O app aguenta volume real sem falhas estruturais.

**Marco intermediario apos passos 5-7**: a maioria dos fetches desnecessarios foi eliminada. Custo Firebase cai significativamente.

**Ultimo passo (#4)**: revisitar #12 (fragilidade do Report) antes ou em paralelo. O dashboard so deve depender exclusivamente do Report quando a sincronizacao for confiavel.

## Estrategia geral

Todos os fixes seguem 4 padroes recorrentes — todos nativos do Firebase, sem servidor:

1. **Chunked batches** — Quebrar `writeBatch` em chunks de 500. Aplica em #1, #9, #10.
2. **Cursor-based paging** — `startAfter()` em vez de offset. Aplica em #6, #9, #10 (delete em paginas).
3. **Queries indexadas em vez de fetch+filter** — `slugifiedName` indexado, `getCountFromServer`, prefix match (`>=` + `<`). Aplica em #5 (count), #7 (prefix), #8 (slugifiedName).
4. **Cache local em Pinia** — Reference data carregado uma vez, mantido sincronizado por refresh manual ou `onSnapshot`. Aplica em #11.

## Raiz do problema

Todos os problemas compartilham a mesma raiz: **o app foi projetado e testado com datasets pequenos**. Nenhuma camada (Firebase services, paginacao, dashboard analytics, cascade ops, busca) tinha protecao contra crescimento de volume. O teste com dados reais de producao (3 anos de extrato) foi o primeiro estresse real do sistema.

Isso nao e um erro de design — e natural em apps pessoais que comecam pequenos. Mas agora que o volume real chegou, cada camada precisa ser adaptada para operar eficientemente com milhares de registros — usando os recursos que o Firebase ja oferece nativamente para esse cenario.
