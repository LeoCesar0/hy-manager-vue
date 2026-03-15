# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server**: `pnpm run dev`
- **Build**: `pnpm run build`
- **Generate static**: `pnpm run generate`
- **Preview build**: `pnpm run preview`
- **Type check**: `pnpm run ts-check` (runs `vue-tsc --noEmit`)
- **Test (run once)**: `pnpm test`
- **Test (watch)**: `pnpm test:watch`
- **Test unit only**: `pnpm test:unit`
- **Test integration only**: `pnpm test:integration`
- **Test coverage**: `pnpm test:coverage`

No linter is configured.

## Architecture

**Nuxt 4 + Vue 3 financial management app** (CSR-only, no SSR). Source code lives in `src/`.

### Key layers

- **Pages** (`src/pages/`): File-based routing. Auth pages at root, protected dashboard pages under `dashboard/`. Routes are in Portuguese (e.g., `/dashboard/transacoes`, `/dashboard/categorias`).
- **Services** (`src/services/`): Two sub-layers:
  - `firebase/` — Generic Firestore CRUD operations (`firebaseCreate`, `firebaseGet`, `firebaseList`, `firebasePaginatedList`, `firebaseUpdate`, `firebaseDelete`, etc.)
  - `api/` — Domain-specific operations (transactions, categories, bank-accounts, creditors, users, files). All use `handleAppRequest()` from `@handlers/handle-app-request.ts` which normalizes responses to `AppResponse<T> = { data: T; error: null } | { data: null; error: AppError }`, manages loading refs, and handles toast notifications.
- **Schemas** (`src/@schemas/`): Zod schemas for all data models (user, transaction, category, bank-account, counterparty, file) and validation primitives.
- **Stores** (`src/composables/stores/`): Pinia stores — `useFirebaseStore` (Firebase instances), `useUserStore` (auth state), `useDashboardStore` (bank accounts, selection), `useDarkModeStore`.
- **Components** (`src/components/`): Domain components (Dashboard/, Transactions/, Categories/, BankAccounts/) and shadcn-vue primitives in `ui/` (prefixed with `Ui`).
- **Helpers** (`src/helpers/`): Small utility functions (formatCurrency, formatDate, slugify, etc.).
- **Static data** (`src/static/`): App config, route definitions, category icons/colors, default categories.

### Backend

Firebase 12.x — Authentication (Google OAuth + Email/Password), Firestore (database), Cloud Storage (files). No custom backend server.

### UI Stack

shadcn-nuxt + reka-ui for components, Tailwind CSS 4 for styling, lucide-vue-next for icons, vee-validate + zod for forms, @tanstack/vue-table for tables, @unovis/vue for charts.

### Auth flow

Global middleware (`src/middleware/auth.global.ts`) listens to `onAuthStateChanged`. On first auth, `handleInitializeUser()` creates user doc in Firestore. User state lives in `useUserStore`.

## Conventions

### Code patterns (from .cursorrules)

- **Parameter Object Pattern**: All functions take a single object param with typed `IProps`.
- **Single export per .ts file**: File name matches the exported function name.
- **No barrel files**: Never use `export * from ...` or centralize exports in index files. Import directly from concrete paths.
- **Script setup first**: `<script setup lang="ts">` always at the top of Vue SFCs.
- **Descriptive functions over emits**: Prefer passing callback functions as props over Vue emits.
- **Type-safe mutations**: Always type the value object before passing to model create/update operations.
- **Avoid `any`**: Use proper types; only use `any` as a last resort.
- **Never use Firebase services directly in UI**: Always go through the API layer (`src/services/api/`).
- **Paginate services with search**: `paginate*` services accept optional `search` param; when present, they fetch all matching docs via `firebaseList`, apply text filtering in the service layer, and return `IPaginationResult` — same shape as the non-search path.

### API Service Layer (`src/services/api/`)

- **UI-facing services** use `handleAppRequest()` for error normalization, toast notifications, and loading state. These are what pages/components import (e.g., `createTransaction`, `deleteCategory`, `getBankAccount`).
- **Internal services** (reports/, sync/) are building blocks called from within UI-facing services. They do NOT use `handleAppRequest()` to avoid double-wrapping. They use try-catch or throw directly.
- **Toast options helpers**: Use `getDefaultCreateToastOptions`, `getDefaultUpdateToastOptions`, `getDefaultDeleteToastOptions`, `getDefaultGetToastOptions` from `src/helpers/toast/` for standard CRUD messages. Custom messages only for domain-specific operations (import, upload).
- **Type naming**: `IAPI{Verb}{Entity}` (e.g., `IAPICreateTransaction`, `IAPIGetCategory`, `IAPIPaginateTransactions`).
- **Collection naming**: Use the Firebase collection constants — `"transactions"`, `"categories"`, `"bankAccounts"`, `"creditors"` (counterparties), `"users"`, `"files"`, `"reports"`.

### Styling

- Use shadcn-tailwind color tokens (primary, secondary, accent, border, background, etc.).
- Transaction-specific colors via CSS variables: `--deposit` (income/green) and `--expense` (red), with utility classes `.text-deposit`, `.bg-deposit`, `.text-expense`, `.bg-expense`.
- Dark mode supported via CSS variables in `src/styles/tailwind.css`.

### Naming

- Composables: `use<Name>.ts`
- Schemas: Zod schemas in `src/@schemas/models/`
- Services: verb-noun pattern (`create-transaction.ts`, `get-categories.ts`)
- Components: PascalCase directories matching domain (Dashboard/, Transactions/)

### Form inputs

- **Always use `Form/Field/DatePicker`** (`src/components/Form/Field/DatePicker.vue`) for date inputs.
- **Inside forms**: Use `FormField` with `inputVariant` (e.g., `inputVariant="datepicker"`) to get label, validation, and form integration for free.
- **Outside forms** (filters, standalone controls): Import the specific `Form/Field/*` component directly (e.g., `DatePicker`, `MultipleSelect`).

### Auto-imports

Nuxt auto-imports from `src/composables/*.ts` and `src/composables/**/*.ts`. No need to manually import composables or Vue APIs.

### Suggestions

If you have any concern or can view any problem on our plan or my suggestions, let me know. Let's discuss the changes and paths to forward.

### Types

- Avoid any types
- Always try to type as best as possible
- Reuse already defined types.
- If an type or interface already exists are we should reference it, use it instead of duplicating code
- When reusing already defined types, you can merge, extend or omit it.

## Validating Request

Always validate the current request. If that makes sense and possible flaws. You can always suggest changes if applicable.

## Auto Improvement Action

When user asks for auto improvement action, you must review the latest changes you did to learn and align patterns that we must keep in the app.
When you notice important app patterns. Add it here in CLAUDE.md for future tasks.
If there is not worth patterns or rules to be add, just reply the user that's all fine.

The reasons is for memory and learning process, adapting the style to enhance the app patterns.

You can also suggest any changes and improvements into current patterns (needs approvement from the user)
