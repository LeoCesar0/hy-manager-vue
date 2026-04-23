---
status: open
type: bug
severity: medium
found-during: "Discussao sobre estrategias de performance sem servidor"
found-in: "src/services/api/reports/update-report.ts"
working-branch: ""
found-in-branch: "main"
date: 2026-04-23
updated: 2026-04-23
resolved-date:
discard-reason:
deferred: true
deferred-reason: "Decisao do usuario de adiar — sera reavaliado depois das melhorias de performance."
related-commits:
related-observations:
  - docs/observations/dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md
---

# Sync client-side do Report e best-effort e pode dessincronizar silenciosamente

## Contexto

O app mantem um documento `Report` por bank account com totais e breakdowns pre-agregados (totais por categoria, por counterparty, por mes, com counts e cross-ref). Esse Report e a base candidata para o dashboard parar de reprocessar transacoes brutas (vide observation `dashboard-loads-all-transactions`).

Como o app e SPA puro (Firebase Hosting + Firebase SDK no client, sem servidor proprio nem Cloud Functions), a manutencao do Report tambem e feita no client: cada `createTransaction`, `updateTransaction`, `deleteTransaction` e `importTransactions` chama, em sequencia, uma funcao que le o Report atual, aplica um delta (`+1` ou `-1`) e regrava o documento inteiro.

Esse arranjo funciona na maioria dos casos, mas tem fragilidades estruturais que podem produzir dados incorretos no dashboard sem que o usuario perceba. As fragilidades nao foram observadas como bug em producao ainda, mas sao reais e tendem a aparecer conforme o uso cresce (mais transacoes, mais sessoes simultaneas, mais operacoes de import).

### Fragilidades identificadas

1. **Catch silencioso** — `update-report.ts:39-41` e `update-report-bulk.ts:36-39` engolem qualquer erro e apenas logam no console. Se a escrita do Report falhar (regra de seguranca, conexao, conflito), a transacao foi criada mas o Report fica desatualizado. O usuario nao recebe nenhum aviso. Nao ha retry, nao ha fila de re-tentativa, nao ha marcacao de "Report inconsistente".

2. **Operacoes nao atomicas** — `createTransaction` (e analogos) faz duas escritas independentes: primeiro a transacao, depois o Report. Se o usuario fechar o tab/perder conexao entre as duas, a transacao persiste mas o Report nao foi atualizado. Em update/delete o problema e ainda maior porque o delta e `oldTransaction (-1) + newTransaction (+1)` — uma escrita parcial deixa o Report com totais negativos ou duplicados.

3. **Race condition em escritas concorrentes** — o padrao "ler Report, calcular delta, escrever Report" nao e atomico. Dois tabs abertos (ou duas operacoes simultaneas no mesmo tab via `Promise.all`) podem ler o mesmo Report base, aplicar deltas diferentes, e o ultimo `setDoc` sobrescreve o outro (lost update). Para uso pessoal de 1 usuario em 1 tab e improvavel, mas o `import-transactions` ja faz operacoes em sequencia que se sobrepoem com qualquer create/update concorrente.

4. **Sem caminho automatico de auto-heal** — existe `rebuild-report.ts` que reconstroi o Report do zero a partir de todas as transacoes da conta, mas precisa ser chamado manualmente. O usuario nao tem um botao "recalcular relatorio" exposto, e nao ha verificacao periodica que detecte divergencia.

## Examples

Cenarios concretos onde as fragilidades aparecem:

- **Failure parcial no import** — Usuario importa CSV com 1500 transacoes. As transacoes sao criadas em batch, mas o `updateReportBulk` falha (ex: rede caiu antes do commit). O catch silencioso loga no console e segue. Resultado: dashboard mostra totais que nao batem com a soma real das transacoes.
- **Edicao de valor com falha entre escritas** — Usuario edita uma transacao de R$ 100 para R$ 1000. `updateTransaction` salva o novo valor. Antes do `updateReport` rodar, conexao cai. Resultado: transacao atualizada, Report ainda contando R$ 100. A diferenca de R$ 900 some do dashboard.
- **Delete + Create simultaneos** — Usuario deleta uma transacao e cria outra rapidamente. Ambos `updateReport` leem o mesmo snapshot inicial, calculam deltas diferentes, e o segundo `setDoc` sobrescreve o primeiro. Resultado: um dos deltas se perde.

## Where

- `src/services/api/reports/update-report.ts:39-41` — catch silencioso (apenas `console.error`)
- `src/services/api/reports/update-report-bulk.ts:36-39` — catch silencioso (loga e re-throw, mas o caller no import nao trata)
- `src/services/api/transactions/create-transaction.ts:60` — escrita da transacao + `updateReport` em sequencia, sem atomicidade
- `src/services/api/transactions/update-transaction.ts:69` — mesmo padrao com delta duplo (-1 + +1)
- `src/services/api/transactions/delete-transaction.ts:31` — mesmo padrao
- `src/services/api/transactions/import-transactions.ts:271` — bulk update apos criar todas as transacoes, sem rollback se falhar
- `src/services/api/reports/apply-transaction-to-report.ts` — logica de delta usa `Math.max(0, ...)` para nao ir negativo, o que mascara divergencia (totais ficam clampados em 0 em vez de revelar o erro)

## Por que importa

- **Dashboard pode mostrar dados incorretos** — Justamente quando o Report passar a ser fonte unica do dashboard (proxima fase de performance), qualquer divergencia se traduz em totais errados na tela.
- **Falha invisivel** — Sem aviso ao usuario, a confianca no app cai quando os numeros nao batem com a realidade do banco.
- **Mascaramento via `Math.max(0, ...)`** — A logica de delta nunca deixa o Report ir negativo. Isso e razoavel como protecao de UX, mas tambem esconde o sintoma do bug — em vez de detectar "Report descalibrado", os numeros simplesmente "afundam" silenciosamente.
- **Bloqueio para fix do dashboard** — A mudanca do dashboard para consumir Report pre-agregado depende dessa robustez. Sem isso, performance melhora as custas de confiabilidade.

## Suggested approach

Existem duas frentes — uma client-only (mitigacao) e uma com Cloud Functions (solucao). O usuario expressou disposicao **talvez** para Functions; entao registrar ambas.

### Mitigacao client-only (sem servidor)

1. **Transacao atomica via Firestore transaction** — substituir `updateReport` por `runTransaction()` do Firestore: ler Report e escrever Report dentro da mesma transacao. Isso resolve a race condition (#3) mas nao resolve a falta de atomicidade entre "criar transacao" e "atualizar Report" (#2) — o Firestore so suporta transactions atomicas dentro de um unico runTransaction, e o write da transaction principal precisa ser parte do mesmo bloco.
2. **Mover write da transacao para dentro do runTransaction** — `runTransaction` aceita multiplos reads/writes atomicos. A operacao toda passa a ser `read Report -> write Transaction + write Report`. Resolve #2 e #3, mas aumenta latencia (transactions tem retry interno) e tem limite de tamanho (especialmente em import bulk).
3. **Fila de re-tentativa local** — quando `updateReport` falha, marcar a operacao em `localStorage` e re-tentar quando a conexao voltar. Mitiga #1, nao resolve completamente.
4. **Botao "recalcular relatorio" no UI** — expor `rebuildReport` para o usuario poder corrigir manualmente. Mitiga #4 mas exige intervencao manual.
5. **Health check periodico** — comparar totais do Report com `getCountFromServer` das transacoes da conta. Se divergir, alertar o usuario ou disparar rebuild automatico. Mitiga #4.

### Solucao com Cloud Functions (servidor)

Cloud Function com trigger `onWrite` em `transactions/{id}`:
- Executa apos cada create/update/delete confirmado no Firestore.
- Roda `applyTransactionToReport` no servidor de forma idempotente.
- Pode usar `runTransaction` para atomicidade total.
- Permite retries automaticos do Firebase em caso de falha.
- Resolve #1, #2, #3, #4 de uma vez.
- Custo: requer billing tier Blaze + observabilidade + deploy de Functions.

A escolha depende do peso que damos a confiabilidade dos dados vs simplicidade de infra. Vale revisitar essa decisao quando o dashboard de fato comecar a depender exclusivamente do Report.

## Observacoes relacionadas

- [Dashboard carrega todas as transacoes brutas](../../dashboard/performance/2026-04-19-dashboard-loads-all-transactions.md) — a robustez do Report e prerequisito para essa migracao
