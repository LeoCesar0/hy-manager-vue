---
status: open
type: enhancement
severity: medium
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/services/csv-import/parse-bank-statement.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
discard-reason:
deferred:
sample-file: "src/assets/statement-examples/inter/inter-statement-example.csv"
---

# Inter bank statement import not supported

## What was found

The CSV import pipeline currently only supports **Nubank** statements. A user with a Banco Inter account has no way to upload their statement file and must enter transactions manually.

The infrastructure for multi-format parsing already exists — `parse-bank-statement.ts` routes to the right parser based on `selectedFormat`, and there's a `nubank-parser.ts` + `nubank-auto-category-map.ts` pair. Adding Inter is a matter of writing the second parser, not reworking the pipeline.

## Where

- `src/services/csv-import/parse-bank-statement.ts` — dispatcher
- `src/services/csv-import/parsers/nubank-parser.ts` — reference implementation
- `src/services/csv-import/parsers/extract-description-parts.ts` — shared description cleanup helper
- `src/static/nubank-auto-category-map.ts` — keyword → category ID map used by `resolve-auto-category-id.ts`
- `src/components/Transactions/ImportSheet.vue:35` — `selectedFormat` state currently defaulting to `AVAILABLE_FORMATS[0]?.key || "nubank"` — need to add Inter to the format list
- `src/services/csv-import/@types.ts` (likely) — where `IBankStatementRow` and the format enum live

## Why it matters

Inter is one of the largest Brazilian digital banks — excluding it materially reduces the app's usable audience. Also, this observation is tightly coupled with the "bank account company field" enhancement (see `bank-accounts/enhancement/2026-04-05-bank-account-company-field.md`): once accounts carry a company field, the import flow can auto-detect the right parser from the selected bank account instead of making the user choose.

## Format reference (from sample file)

A real Inter statement CSV has been captured at `src/assets/statement-examples/inter/inter-statement-example.csv`. Key characteristics that differ from Nubank:

**Delimiter**: `;` (semicolon) — **not comma** like Nubank. `Papa.parse` needs explicit `delimiter: ";"` or auto-detection.

**Preamble before the header** (rows 1–5):
```
 Extrato Conta Corrente
Conta ;279552505
Período ;28/02/2026 a 29/03/2026
Saldo ;453,94

Data Lançamento;Histórico;Descrição;Valor;Saldo
```
The real header is on row 6. The parser must skip rows until it finds `Data Lançamento` (or skip the first 5 rows hardcoded — more fragile but simpler).

**Columns** (5, not 4 like Nubank):
1. `Data Lançamento` — date, `DD/MM/AAAA`
2. `Histórico` — transaction type label (e.g. "Compra no débito", "Pix enviado ", "Pix recebido", "Pagamento efetuado", "Aplicação", "Estorno"). Note the trailing whitespace on some values — must `.trim()`.
3. `Descrição` — merchant / counterparty name (e.g. "Armazzem Do Seu Jeito  Teresina      Bra"). Contains location padding that should be cleaned.
4. `Valor` — signed amount in **Brazilian number format**: `-10,99` (comma as decimal, dot as thousands separator). `parseFloat` won't work directly — needs `value.replace(/\./g, "").replace(",", ".")` before `parseFloat`.
5. `Saldo` — running balance (can be ignored, we compute this ourselves).

**No unique identifier per row** — unlike Nubank which includes a UUID `Identificador` column, Inter provides none. Dedup must be synthesized:
- Option 1: hash of `${date}-${amount}-${description}-${rowIndex}` (rowIndex breaks ties between identical same-day transactions)
- Option 2: look up existing transactions by `(date, amount, description)` on import and skip matches

**Sign convention**: negative = expense, positive = deposit (same as Nubank).

**Encoding**: the sample loads cleanly as UTF-8. Confirm with a fresh export.

**Domain gotchas worth noting**:
- `Aplicação` (e.g. row 40: "Aplicação;Cdb Porq Obj Banco Inter Sa;-500,00") — this is an **investment**, maps directly to a positive-expense category (Investimentos). Worth pre-seeding the auto-category map with this rule.
- `Estorno` — refund/reversal, shows as a positive value offsetting a prior expense. Should import as a `deposit` type.
- `Pagamento Fatura - <NAME>` — credit card bill payment. Users usually want this categorized as "Cartão de Crédito" or similar.
- `Pix enviado` vs `Pix recebido` — the Histórico column tells you the direction before you even look at the sign.

## Suggested approach

1. **Write `parsers/inter-parser.ts`** following the shape of `nubank-parser.ts`:
   - Accept `delimiter: ";"` in `Papa.parse`
   - Skip preamble rows until a row matches the expected header shape
   - Parse Brazilian number format for `Valor`
   - Combine `Histórico` + `Descrição` into the final `description` field, or keep `Histórico` as a side-channel hint for auto-categorization
   - Synthesize an identifier per row (hash or composite key)
2. **Write `inter-auto-category-map.ts`** with mappings tuned for Inter's description conventions. Seed with:
   - `Aplicação` → Investimentos
   - `Pagamento Fatura` → Cartão de Crédito
   - Common merchants from the sample (Uber, iFood, Mateus Supermercados, etc.) — overlap with Nubank map but descriptions may differ
3. **Register in the dispatcher** `parse-bank-statement.ts`.
4. **Wire to the bank account company field** once that lands (see `bank-accounts/enhancement/2026-04-05-bank-account-company-field.md`). Until then, the format selector in `ImportSheet.vue` needs an "Inter" option added manually.
5. **Test with the sample file** + any additional exports the user provides. Edge cases visible in the sample:
   - Row 19: "Estorno" with positive value — verify it becomes a `deposit`
   - Row 40: "Aplicação" — verify auto-category maps to Investimentos
   - Rows 7, 9, 10, etc.: description padding with trailing "Bra" location code — verify cleanup
   - Row 22: "Pagamento Fatura - ISAELLE AVRIL LAVIGNE BRITO PESSOA" — verify fatura payments are handled
6. **Consider description cleanup helpers**: the existing `extract-description-parts.ts` was written for Nubank's "Compra no débito - MERCHANT" format. Inter's format is different (separate columns) so it likely needs its own helper or an extension to handle both.

Pair with the "bank account company field" work so the import UI can drop the manual format selector entirely once both land.
