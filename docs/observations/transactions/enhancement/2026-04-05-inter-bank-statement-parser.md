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

## Suggested approach

1. **Acquire a sample Inter statement** (CSV or whatever format Inter exports — they may offer OFX, XLS, or PDF). Confirm the format before writing any code.
2. **Write `parsers/inter-parser.ts`** following the same shape as `nubank-parser.ts`:
   - Input: raw file content
   - Output: `IBankStatementRow[]`
3. **Write `inter-auto-category-map.ts`** with keyword → category mappings that match Inter's description conventions (often different from Nubank's — e.g. Inter uses different merchant name formatting).
4. **Register in the dispatcher** `parse-bank-statement.ts` + add to `AVAILABLE_FORMATS` in `ImportSheet.vue`.
5. **Handle Inter-specific quirks**:
   - Sign conventions (is an expense positive or negative in the raw data?)
   - Date format (dd/mm/yyyy vs iso)
   - Character encoding (Latin-1 vs UTF-8 is common with Brazilian bank exports)
   - Transfer/pix descriptions that may need more aggressive cleaning
6. **Test with real files** — both small (few transactions) and large (a year of data) samples. Edge cases: international purchases, chargebacks, installment purchases.

Pair with the "bank account company field" work so the import UI can drop the manual format selector entirely once both land.
