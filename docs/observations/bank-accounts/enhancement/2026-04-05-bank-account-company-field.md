---
status: open
type: enhancement
severity: medium
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/@schemas/models/bank-account.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
discard-reason:
deferred:
---

# BankAccount has no company/provider field — import format is picked manually

## What was found

`IBankAccountBase` currently only stores `{ name, userId }`. There is no structured field identifying which bank/provider the account belongs to. The app relies on:

1. The **user's free-text name** ("Nubank Conta", "Inter Principal", etc.) for display.
2. A **manual format selector** in `ImportSheet.vue` (`selectedFormat`, defaulting to `"nubank"`) for picking which statement parser to run during CSV import.

Adding a typed `company` field (enum: `nubank | inter | ...`) would:

- Let the import flow auto-select the right parser from the selected bank account — no manual picker.
- Enable company-specific logic elsewhere (icons, default colors, integration hints).
- Make the data more analyzable (reports grouped by bank).

## Where

Schema (needs the new field):
- `src/@schemas/models/bank-account.ts` — `zBankAccountBase` schema, currently 2 fields

Forms that need to capture it:
- `src/components/Onboarding/StepBankAccount.vue:39-45` — onboarding step, currently only a name input with placeholder "Ex: Nubank, Itaú, Bradesco…"
- Bank account create/edit forms (check `src/components/BankAccounts/` — confirm exact files when picking up)

Consumer that should replace its manual selector:
- `src/components/Transactions/ImportSheet.vue:35` — `selectedFormat` manual state. Replace with a read from `currentBankAccount.company`
- `src/services/csv-import/parse-bank-statement.ts` — dispatcher that receives the format

## Why it matters

- Every new supported bank (Inter is queued, others will come) compounds the UX friction of the manual format picker.
- Users currently can (and do) pick the wrong format during import, producing silently wrong data.
- A `company` field is a prerequisite for cleaner downstream features (bank-branded UI, Inter parser integration, provider-specific automation).

## Suggested approach

1. **Define the enum** alongside the schema:
   ```ts
   export const bankAccountCompanies = ["nubank", "inter", "other"] as const;
   export const zBankAccountCompany = z.enum(bankAccountCompanies);
   ```
   Include an `"other"` escape hatch so users with unsupported banks can still create accounts — they just won't get CSV import until we ship their parser.
2. **Add `company: zBankAccountCompany` to `zBankAccountBase`**. Requires a Firestore migration path for existing accounts (default them to `"other"` or run a backfill reading the `name` field heuristically).
3. **Onboarding step**: add a `Form/Field/CardSelectItem`-style picker above the name input, with the known bank logos. Pre-fill the name based on the picked company (e.g. pick Nubank → name defaults to "Nubank", user can rename).
4. **Bank account create/edit form**: same picker pattern as onboarding.
5. **ImportSheet**: drop `selectedFormat` state entirely, read `currentBankAccount.company` from `useDashboardStore`, route to the parser automatically. If company is `"other"`, show a fallback message explaining CSV import isn't supported and the user should add transactions manually.
6. **Migration**: write a one-shot script (or on-read hydration) that sets `company: "other"` for legacy docs. Consider whether existing users should be prompted to pick their bank retroactively — a one-time modal "We improved bank accounts, pick your provider:" is less bad than silently bucketing everyone into "other".

Dependency chain: this observation is a prerequisite for the "Inter bank statement parser" observation landing cleanly. They should probably ship together, or at least in the same PR series.

Open question when picking this up: Do we want a free-text `company` fallback for users on small/unknown banks, or is `"other"` sufficient? Start with `"other"` and revisit if user feedback says otherwise.
