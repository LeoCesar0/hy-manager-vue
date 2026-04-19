---
status: open
type: performance
severity: critical
found-during: "Production testing with 2000+ transactions"
found-in: "src/composables/useDashboardAnalytics.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-19
updated: 2026-04-19
resolved-date:
discard-reason:
deferred:
---

# Dashboard home carrega todas as transacoes brutas na memoria

## O que foi encontrado

`useDashboardAnalytics.loadData()` chama `getTransactions()` que usa `firebaseList()` — busca **todos** os documentos do periodo filtrado sem paginacao. Com 2000+ transacoes e periodo padrao de 2 meses, pode trazer centenas de documentos de uma vez.

Apos carregar, 6+ computed properties reprocessam o array inteiro:
- `totals` → `calculateTotals()` itera todas
- `filteredExpenses` / `filteredDeposits` → filtra por tipo
- `expensesByCategory` / `depositsByCategory` → O(n*m) com categorias
- `expensesByCounterparty` / `depositsByCounterparty` → O(n*m) com counterparties
- `insights` → `calculateInsights()` com calculos complexos

Qualquer mudanca no array dispara recalculo em cascata de todas essas computed.

## Onde

- `src/composables/useDashboardAnalytics.ts:153` — `getTransactions()` sem paginacao
- `src/composables/useDashboardAnalytics.ts:94-123` — computed properties encadeadas
- `src/composables/useDashboardAnalytics.ts:236-242` — deep watch em `filters` dispara refetch
- `src/services/api/transactions/get-transactions.ts:43` — usa `firebaseList()` (busca tudo)

## Por que importa

- **Travamento no dashboard**: Carregar centenas de transacoes + processar tudo client-side causa freezes visiveis.
- **Custo Firebase**: Cada abertura do dashboard ou mudanca de periodo = leitura de todas as transacoes do range.
- **Cascata de reatividade**: Uma mudanca em `filteredTransactions` dispara recalculo de 6+ computeds simultaneamente.

## Abordagem sugerida

O app ja possui o modelo `Report` (`src/@schemas/models/report.ts`) que armazena dados pre-agregados por mes: totais, breakdown por categoria e por counterparty. O dashboard deveria usar esses dados em vez de reprocessar transacoes brutas.

**Investigar**:
1. Quais dados o Report ja fornece (totals mensais, breakdowns por categoria/counterparty)
2. O que falta no Report para atender todos os cards e charts do dashboard
3. Se necessario, enriquecer o schema do Report com os campos faltantes

**Resultado esperado**: Dashboard faz 1 leitura (o documento Report) em vez de N leituras (todas as transacoes). As computed properties somam dados ja agregados em vez de processar arrays grandes.

**Nota**: A investigacao de viabilidade do Report como fonte do dashboard esta em andamento. Os dados do Report podem ser suficientes para a maioria dos cards/charts, eliminando a necessidade de buscar transacoes brutas.

## Observacoes relacionadas

- **Overview**: [Performance: travamento com volume real de dados](../../2026-04-19-performance-overview.md)
- **Mesmo padrao (fetch-all)**: [Search full-fetch](../../transactions/performance/2026-04-19-search-full-collection-fetch.md) — ambos usam `firebaseList()` sem limite, trazendo tudo para o client
- **Enriquecimento do Report**: [Enrich report monthly entry schema](../../reports/enhancement/2026-04-11-enrich-report-monthly-entry-schema.md) — investigacao previa sobre expandir o schema do Report
