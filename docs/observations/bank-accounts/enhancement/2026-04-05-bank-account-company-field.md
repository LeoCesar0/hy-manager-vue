---
status: resolved
type: enhancement
severity: medium
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/@schemas/models/bank-account.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
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

## Confirmed decisions

- **`"other"` is the escape hatch** (confirmed with user). Users on unsupported banks can still create accounts — they simply lose access to the features that require a known provider (currently: CSV file upload). This is acceptable because manual transaction entry still works.
- **Feature gating pattern**: provider-dependent features check `currentBankAccount.company !== "other"` and show a disabled state with a short explanation. This pattern is reusable as we add more integrations (OFX import, open banking, provider-specific automations).

## Suggested approach

1. **Define the enum** alongside the schema:
   ```ts
   export const bankAccountCompanies = ["nubank", "inter", "other"] as const;
   export const zBankAccountCompany = z.enum(bankAccountCompanies);
   ```
2. **Add `company: zBankAccountCompany` to `zBankAccountBase`**. Requires a Firestore migration path for existing accounts — set `company: "other"` for all legacy docs (see migration step below).
3. **Onboarding step**: add a `Form/Field/CardSelectItem`-style picker above the name input, with the known bank logos (Nubank, Inter, Other). Pre-fill the name based on the picked company (e.g. pick Nubank → name defaults to "Nubank", user can rename). "Other" keeps the name field blank for the user to fill.
4. **Bank account create/edit form**: same picker pattern as onboarding.
5. **ImportSheet (and any other company-gated feature)**: drop `selectedFormat` state, read `currentBankAccount.company` from `useDashboardStore`, route to the parser automatically. If `company === "other"`, render a disabled state with copy like "Upload de extrato não disponível para este banco — adicione as transações manualmente". **Do not** silently fall through to a default parser — that's what produces wrong imports today.
6. **Migration**: write a one-shot script (Firebase Admin or a lazy on-read hydration) that sets `company: "other"` for legacy docs. Consider a one-time post-login modal "Escolha o banco das suas contas existentes:" so existing users can opt into the full experience instead of being silently bucketed into "other".
7. **Feature-gate audit**: after landing, grep the codebase for any other place that currently assumes a single bank format (there's at least `ImportSheet.vue` and anywhere the parsers are invoked) and make sure it reads `company` correctly or gates behind the `"other"` check.

Dependency chain: this observation is a prerequisite for the "Inter bank statement parser" observation landing cleanly. They should probably ship together, or at least in the same PR series.

## Resolution

Resolved 2026-04-05 — shipped together with the Inter parser observation.

**Schema** (`src/@schemas/models/bank-account.ts`): added
`bankAccountCompanies = ["nubank", "inter", "other"] as const` and
`zBankAccountCompany = z.enum(bankAccountCompanies)`. Added
`company: zBankAccountCompany.default("other")` to `zBankAccountBase`
— the `.default()` is the migration path: legacy docs without the field
parse cleanly as `"other"` on read, with no separate migration script
required. The field is persisted on next write (user edits the account).
Also exported `BANK_ACCOUNT_COMPANY_LABELS` for UI pickers to stay in
sync with the enum.

**Onboarding step** (`src/components/Onboarding/StepBankAccount.vue`):
added a 3-column button grid above the name input. Selecting a known
bank auto-fills the account name if it's empty or matches the previous
auto-filled value, so manual edits aren't clobbered. The explanatory
copy below the grid tells users that "other" still works but loses
CSV import.

**Bank account form** (`src/components/BankAccounts/BankAccountForm.vue`):
same 3-column button grid pattern. Uses `values` and `setFieldValue`
from vee-validate to sync the company field through both create and
edit flows. `createBankAccountInitialValues` in
`pages/dashboard/contas-bancarias/index.vue` got `company: 'other'`.

**Onboarding composable** (`src/composables/useOnboarding.ts`): added
`bankAccountCompany` ref, updated `handleBankAccountNext` to accept
`{ name, company }`, and `completeOnboarding` now passes the company
through to `createBankAccount`.

**ImportSheet gating**: see the Inter parser observation resolution for
details. `currentBankAccount.company === "other"` renders a disabled
state explaining that upload isn't available, instead of silently falling
through to a default parser.
