---
status: resolved
type: enhancement
severity: low
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/@schemas/models/counterparty.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
discard-reason:
deferred:
---

# Rename "Terceiros / Counterparties" to "Identificadores / Identifiers"

## What was found

The domain entity currently called "Counterparty" in code and "Terceiros" in Portuguese UI should be renamed to "Identifier" / "Identificadores". The current label is technically accurate (a counterparty is the other side of a transaction — a merchant, a person, a payee) but doesn't match how users think of the concept in the app.

In practice users use these rows to **identify recurring transaction patterns** — a Stripe payout, a salary deposit, an Uber charge — so "Identificador" reads more naturally than "Terceiro".

## Where

The rename touches both code and copy. Scope of affected surface:

**Code identifiers** (internal naming — large rename, touches many files):
- `src/@schemas/models/counterparty.ts` — schema file + type names (`ICounterparty`, `zCounterparty`, etc.)
- `src/services/api/counterparties/` — entire folder
- `src/components/Counterparties/` (or wherever the components live) — component names
- `src/composables/stores/*` — any `useCounterpartiesStore`
- Firestore collection name: currently `"creditors"` per CLAUDE.md — **this is already inconsistent with the code name**. Worth resolving as part of the rename.

**UI copy** (Portuguese strings — smaller surface):
- "Terceiros" → "Identificadores" in all menu labels, table headers, form labels, toasts, empty states
- Route path `/dashboard/terceiros` (if it exists) → `/dashboard/identificadores`
- Any README / docs files that refer to the concept

## Why it matters

- **Cognitive alignment**: "Identificador" matches the user's mental model. "Terceiro" is legal/accounting jargon that the app's target user may not parse instantly.
- **Incidental cleanup**: the current code/collection mismatch (code = `counterparty`, Firestore = `creditors`) is already a mild maintenance burden. A rename is the natural moment to collapse everything to one term.

## Suggested approach

**Not a 5-minute find-replace.** This is a non-trivial rename and the effort differs wildly depending on how deep it goes. Three discrete scopes to choose from:

### Scope A — UI copy only (recommended starting point)

Touch only user-facing Portuguese strings. Code keeps `counterparty`, Firestore collection keeps `creditors`. Effort: ~30 min.

- Grep Vue templates for `Terceiros?` and replace with `Identificadores?`
- Update menu labels, route display names, form labels, empty states, toasts
- Leave the URL path (`/dashboard/terceiros`) as-is unless it's visible to users often enough to matter — URL renames require redirect handling
- Zero code or schema changes, zero migration

### Scope B — UI copy + route path

Scope A plus rename the route from `/dashboard/terceiros` to `/dashboard/identificadores`. Effort: ~1h.

- Rename the page file + add a redirect from the old path to avoid breaking bookmarks
- Update any internal `<NuxtLink>` / `navigateTo` references

### Scope C — Full rename (code + Firestore)

Rename `counterparty` → `identifier` (or `txIdentifier` to avoid variable-name collisions) across the codebase AND rename the Firestore collection. Effort: multi-day, requires migration + deploy coordination.

- Collection rename needs a migration script (create new collection, copy docs, update rules, delete old) — not reversible easily
- Touches `src/@schemas/models/counterparty.ts`, `src/services/api/counterparties/`, `src/components/Counterparties/`, any stores, any tests
- Incidental win: the current code/collection mismatch (code = `counterparty`, Firestore = `creditors`) would be resolved

**Proposed direction (not confirmed — decide when picking up the task):**

Start with **Scope A**. Deliver the user-facing benefit immediately with almost no risk. If the term "Identificador" sticks after real usage, revisit Scope C as a cleanup pass. Scope B is an in-between — not clearly worth the extra effort over A unless users are sharing URLs to the page.

The `counterparty` vs `identifier` code name question is the thornier half of Scope C: `identifier` collides with a very common programming term, so if we do rename code we should probably pick something more specific like `txIdentifier` or keep `counterparty` and only rename the display layer. **This is the main open question to resolve before committing to Scope C.**

### Open questions

1. Is "Identificador" the final term, or still under discussion?
2. If going to Scope C: what's the code-level name? `identifier` (collision-prone), `txIdentifier` (explicit), or keep `counterparty` and treat "Identificador" as display-only?
3. Is the route path (`/dashboard/terceiros`) shared externally enough to warrant the Scope B redirect work?

## Resolution

Resolved 2026-04-05 — Scope A only (UI copy). Code identifiers
(`ICounterparty`, `counterpartyId`, Firestore `creditors` collection, URL
path `/dashboard/terceiros`) left untouched; revisit in a future Scope C
pass if the term sticks.

Files updated: `src/static/routes.ts` labels, toast messages in all
`src/services/api/counterparties/*.ts` files, component labels in
`BreakdownDetail`, `MonthlyComparison`, `PeriodDonuts`, dashboard donut
titles and empty messages, `ImportSheet` summary label, `FilterPanel`
field label, transaction form/card/list-section labels,
`TransactionsListSection` CSV export header, `Dashboard/InsightsGrid`
insight card titles, `UncategorizedBanner` title and count wording,
`CounterpartyForm` toast messages, `CreateSheet`/`EditSheet` titles, all
`pages/dashboard/terceiros/*.vue` headings, subtitles, dialog titles and
toast messages, `group-by-counterparty.ts` "Sem terceiro" fallback label,
and the `Transactions/README.md` developer doc for consistency. Pluralization
updated from "terceiros" to "identificadores" (plural suffix "es" not "s").
Confirmed zero remaining user-facing "terceiro" strings via grep.
