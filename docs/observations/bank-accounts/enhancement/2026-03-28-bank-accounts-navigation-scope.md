---
status: open
type: enhancement
severity: medium
found-during: "brainstorm session - bank accounts flow and navigation hierarchy"
found-in: "src/static/routes.ts, src/layouts/dashboard.vue"
found-in-branch: "main"
date: 2026-03-28 10:00
updated: 2026-03-28 10:00
resolved-date:
discard-reason:
deferred:
---

# Bank accounts page should not be in the main sidebar menu

## What was found
"Contas Bancárias" appears in the "Gerenciamento" sidebar group alongside Transações, Categorias, and Terceiros. This creates a conceptual mismatch — bank accounts are the global context that filters everything else, not a peer of the content pages. The dropdown selector in the sidebar header already handles account switching, but CRUD management requires navigating to a separate menu item that sits at the wrong hierarchy level.

## Where
- `src/static/routes.ts` — `bankAccounts` route has `menu: { icon: WalletIcon, group: 'management' }` (lines 130-137)
- `src/layouts/dashboard.vue` — sidebar header already has the bank account dropdown selector (lines 118-131)

## Why it matters
- Confuses the mental model: managing the "context" (bank account) is mixed with managing "content within that context" (transactions, categories, counterparties)
- The "Gerenciamento" group should only contain pages that operate within the scope of the selected bank account
- Users may not associate the sidebar menu item with the dropdown selector, creating two separate mental models for the same concept

## Suggested approach
1. **Remove `menu` from the `bankAccounts` route** in `src/static/routes.ts` — this removes it from the sidebar nav
2. **Add a "Gerenciar contas" action** next to the bank account dropdown selector in the sidebar header (e.g., a settings/gear icon or a "Gerenciar" link at the bottom of the dropdown)
3. The page `/dashboard/contas-bancarias` remains unchanged — only the entry point changes
4. Keep the route and page as-is for direct URL access and for the "no bank accounts" empty state CTA

**Explicitly decided against:** Creating a separate layout or component hierarchy for "global" pages. Only one such page exists today (bank accounts). Separating layouts would mean maintaining two layouts in sync with no real benefit. Revisit if 3+ global/config pages exist in the future.
