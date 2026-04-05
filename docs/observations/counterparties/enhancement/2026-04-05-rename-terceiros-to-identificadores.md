---
status: open
type: enhancement
severity: low
found-during: "Transforming todo.md backlog into observation files"
found-in: "src/@schemas/models/counterparty.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date:
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

**Not a 5-minute find-replace.** This is a non-trivial rename that needs a plan:

1. **Decide the code name first**: `identifier` is a very generic word in programming (it collides with variable naming everywhere). Consider alternatives:
   - `txIdentifier` / `ITxIdentifier` — explicit namespacing
   - `transactionIdentifier`
   - Keep `counterparty` in code, only rename the UI copy — separates concerns, avoids the collision problem. **This is probably the right call.**
2. **If code stays `counterparty`**: the task collapses to a UI copy sweep — much simpler. Grep for "Terceiros?" and "Counterpart" in Vue templates and replace. Keep the code paths and types untouched.
3. **If code also changes**: plan for a Firestore collection rename (requires a migration — create new collection, copy docs, update rules, update code, delete old collection — across a deploy). Not trivial.
4. **Migration path** (if collection renames): existing users' data needs to carry over. Either do a server-side script via Firebase Admin, or lazy-migrate on read (create the new doc on first access, delete the old).

**Recommendation**: start with option 2 — UI copy only. That delivers 90% of the user-facing benefit in 1% of the effort, and the deeper rename can be re-evaluated once the term is validated against real user feedback.

**Open question when picking this up**: is "Identificador" the final term, or still under discussion? The effort difference between UI-only and full rename is so large that this should be confirmed before doing anything.
