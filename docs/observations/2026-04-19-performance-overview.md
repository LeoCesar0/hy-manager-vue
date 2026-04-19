---
status: open
type: performance
severity: critical
date: 2026-04-19
updated: 2026-04-19
---

# Performance: travamento com volume real de dados (2000+ transacoes)

## Contexto real

Ao testar o app em producao pela primeira vez com dados reais — extrato bancario dos ultimos 3 anos, mais de 2000 transacoes — o app apresentou lentidao severa e travadas visiveis na UI. O problema nao era perceptivel em desenvolvimento porque os testes usavam volumes pequenos (dezenas de transacoes).

Esse cenario expoe um padrao comum: **o app foi construido assumindo volumes pequenos em todas as camadas**. Nao ha um unico culpado — sao 6 problemas independentes que se amplificam mutuamente quando o volume de dados cresce.

## Jornada do usuario que expoe os problemas

### Fase 1: Import do extrato
O usuario faz upload do CSV com 2000+ transacoes. Nessa fase, 3 problemas atuam juntos:

1. **[Deduplicacao pesada](transactions/performance/2026-04-19-import-deduplication-heavy-queries.md)** — O sistema precisa verificar quais transacoes ja existem. Faz 67+ queries paralelas ao Firebase (chunks de 30 IDs) e depois busca todas as transacoes do periodo para comparacao por campos. Na primeira importacao isso e rapido (nao ha dados), mas em re-importacoes (caso comum ao testar) o custo e alto.

2. **[Counterparties sequenciais](transactions/performance/2026-04-19-import-sequential-counterparty-creation.md)** — Cada nome de pagador/recebedor novo e criado com um request individual ao Firebase. 100 nomes unicos = 100 round-trips sequenciais (~10-30s so nessa etapa).

3. **[Batch sem limite de 500](transactions/performance/2026-04-19-firebase-batch-500-limit.md)** — As 2000 transacoes sao colocadas num unico `writeBatch` do Firestore. O limite e 500 operacoes. O batch falha silenciosamente ou apresenta erro generico.

**Efeito combinado no import**: O usuario ve "Importando transacoes..." por um tempo longo e indeterminado. Pode falhar sem explicacao clara. Se funcionar parcialmente, fica impossivel saber quantas transacoes realmente foram criadas.

### Fase 2: Navegacao no dashboard
Apos o import, o usuario vai para a dashboard home. Aqui atua:

4. **[Dashboard carrega tudo](dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md)** — `getTransactions()` busca todas as transacoes do periodo filtrado (padrao: 2 meses, mas pode ser 6 meses). Com 2000+ transacoes, carrega centenas de documentos e processa tudo client-side em 6+ computed properties encadeadas. A UI trava enquanto processa.

### Fase 3: Listagem de transacoes
O usuario navega para `/transacoes` para ver e buscar suas transacoes. Dois problemas atuam:

5. **[Paginacao offset](transactions/performance/2026-04-19-offset-pagination-degradation.md)** — A paginacao busca `page * limit` documentos e descarta os anteriores. Funciona bem na pagina 1 (20 docs), mas na pagina 50 busca 1000 docs para mostrar 20. Com 100 paginas de transacoes, o final da lista e praticamente inacessivel.

6. **[Search full-fetch](transactions/performance/2026-04-19-search-full-collection-fetch.md)** — Ao buscar por descricao, o sistema baixa todas as transacoes filtradas para fazer `.includes()` no client. Cada keystroke (apos 400ms debounce) repete esse fetch completo.

**Efeito combinado na navegacao**: As primeiras paginas carregam normalmente, mas a experiencia degrada conforme o usuario avanca. A busca e especialmente lenta. O usuario percebe "travadas estranhas" que sao na verdade o browser processando arrays grandes no main thread.

## Grafo de dependencias

```
[1] Batch limit 500
 ^
 |  depende de
 |
[4] Counterparties sequenciais ——— usaria firebaseCreateMany apos fix do [1]

[6] Deduplicacao pesada ——————————— problema isolado, mas import lento amplifica percepcao

[3] Dashboard carrega tudo ———————— problema isolado, domina a percepcao de "lentidao geral"

[2] Paginacao offset ————————————— problema isolado, cresce com volume

[5] Search full-fetch ———————————— problema isolado, agravado pela ausencia de filtro de data obrigatorio
```

Apenas [4] depende diretamente de [1]. Os demais sao independentes e podem ser resolvidos em qualquer ordem.

## Ordem sugerida de resolucao

| Ordem | Problema | Motivo da prioridade |
|-------|----------|---------------------|
| 1 | [Batch limit 500](transactions/performance/2026-04-19-firebase-batch-500-limit.md) | Prerequisito para [4] e corrige um bug real (import falha) |
| 2 | [Counterparties sequenciais](transactions/performance/2026-04-19-import-sequential-counterparty-creation.md) | Quick win apos [1], maior ganho perceptivel no import |
| 3 | [Deduplicacao](transactions/performance/2026-04-19-import-deduplication-heavy-queries.md) | Simplifica e acelera re-importacoes |
| 4 | [Dashboard carrega tudo](dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md) | Maior impacto na UX diaria, mas requer investigacao do Report |
| 5 | [Paginacao offset](transactions/performance/2026-04-19-offset-pagination-degradation.md) | Impacto cresce com volume, mudanca estrutural na paginacao |
| 6 | [Search full-fetch](transactions/performance/2026-04-19-search-full-collection-fetch.md) | Mitigavel com filtro de data obrigatorio antes de investir mais |

## Raiz do problema

Todos os 6 problemas compartilham a mesma raiz: **o app foi projetado e testado com datasets pequenos**. Nenhuma camada (Firebase services, paginacao, dashboard analytics) tinha protecao contra crescimento de volume. O teste com dados reais de producao (3 anos de extrato) foi o primeiro estresse real do sistema.

Isso nao e um erro de design — e natural em apps pessoais que comecam pequenos. Mas agora que o volume real chegou, cada camada precisa ser adaptada para operar eficientemente com milhares de registros.
