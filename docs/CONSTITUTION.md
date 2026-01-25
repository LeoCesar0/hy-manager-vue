# Application Governance & Constitution

This document establishes the architectural principles, coding standards, and best practices for the Personal Finance Manager application.

## Quick Reference: Golden Rules

These are the most important principles to follow consistently throughout the codebase:

1. **DRY (Don't Repeat Yourself)**
   - Extract reusable components for similar UI patterns
   - Create helper functions for repeated operations
   - Use composables for shared reactive logic
   - Wait for 3+ repetitions before abstracting

2. **One Function Per File**
   - Each service file exports one primary function
   - File name matches the function name (kebab-case)
   - Private helpers stay within the file (not exported)
   - Clear separation: services (data) vs logic (transformations)

3. **Single Object Parameter**
   - Functions accept one typed object parameter
   - Maximum 2 parameters (e.g., `id` + `data` object)
   - Use named properties for clarity
   - Easy to extend without breaking changes

4. **Component Reusability**
   - Design components to be reusable from the start
   - Use slots for flexible composition
   - Props for configuration, events for communication
   - Generic components for forms, lists, cards, empty states

5. **Separation of Concerns**
   - Services: Data access and API calls
   - Analytics: Business logic and calculations
   - Components: Presentation and user interaction
   - Never mix data fetching with business logic

## Core Principles

### 1. DRY - Don't Repeat Yourself

The DRY principle states that every piece of knowledge or logic should have a single, unambiguous representation within a system.

**Why DRY Matters:**
- Reduces maintenance burden (fix bugs in one place)
- Improves consistency across the application
- Makes code easier to understand and modify
- Reduces the risk of inconsistent behavior

**Application Strategies:**

#### Extract Reusable Components
When you find yourself copying component code, extract it into a shared component.

✅ **Good - Reusable Form Component:**
```typescript
// components/Form/EntityForm.vue - Reusable
<script setup lang="ts">
type IProps = {
  title: string;
  fields: FormField[];
  loading?: boolean;
  initialValues?: Record<string, any>;
};

const emit = defineEmits<{
  submit: [data: Record<string, any>];
  cancel: [];
}>();
</script>
```

❌ **Bad - Duplicated Form Logic:**
```typescript
// Copying the same form structure in:
// - BankAccountForm.vue
// - CategoryForm.vue
// - CreditorForm.vue
// Each with similar validation, submit handling, error display
```

#### Extract Reusable Functions
Common operations should be centralized in helper functions or services.

✅ **Good - Centralized Formatting:**
```typescript
// helpers/formatCurrency.ts
export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Used everywhere consistently
const formatted = formatCurrency(transaction.amount);
```

❌ **Bad - Repeated Formatting Logic:**
```typescript
// Duplicated in multiple components:
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(amount);
```

#### Extract Reusable Composables
Shared reactive logic belongs in composables.

✅ **Good - Reusable Data Fetching:**
```typescript
// composables/useEntityCrud.ts
export const useEntityCrud = <T>(collection: string) => {
  const items = ref<T[]>([]);
  const loading = ref(false);
  
  const loadItems = async (userId: string) => {
    loading.value = true;
    // ... fetch logic
    loading.value = false;
  };
  
  return { items, loading, loadItems };
};

// Used in multiple pages
const { items: categories, loading, loadItems } = useEntityCrud<ICategory>('categories');
```

#### Common Patterns to DRY

**Form Handling:**
- Create generic form components
- Extract validation logic
- Share form state management
- Reuse error display components

**Data Fetching:**
- Abstract common query patterns
- Share loading states
- Centralize error handling
- Reuse pagination logic

**UI Patterns:**
- Extract card layouts
- Share modal/dialog logic
- Reuse table structures
- Centralize theme utilities

**When NOT to DRY:**
Sometimes duplication is acceptable:
- Code that looks similar but serves different purposes
- Premature abstraction (wait for 3+ uses before extracting)
- Logic that may diverge in the future
- Over-abstraction that reduces clarity

### 2. Data Storage Principles

#### Reference by ID, Not Duplication

Always store references (IDs) to related entities rather than duplicating their data.

**Why?**
- Prevents data inconsistency when entities are updated
- Reduces storage requirements
- Ensures single source of truth
- Simplifies data updates

**Examples:**

✅ **Good:**
```typescript
interface Transaction {
  id: string;
  categoryId: string;  // Reference to category
  creditorId: string;  // Reference to creditor
  bankAccountId: string; // Reference to bank account
  amount: number;
}
```

❌ **Bad:**
```typescript
interface Transaction {
  id: string;
  categoryName: string; // Duplicated data
  categoryColor: string; // Duplicated data
  creditorName: string; // Duplicated data
  amount: number;
}
```

**Impact:**
- If you rename a category, you only update one document
- All transactions automatically reflect the new category name when queried
- No orphaned or outdated data

#### Immutable Historical Data

Preserve the integrity of historical financial records.

**Principles:**
- Never delete transactions (use soft delete with `deletedAt` field)
- Consider creating snapshots for auditing when needed
- Maintain complete audit trail
- Comply with financial record-keeping requirements

**Implementation:**
```typescript
interface Transaction {
  // ... other fields
  deletedAt?: Timestamp; // Soft delete marker
  updatedAt: Timestamp;  // Track modifications
  createdAt: Timestamp;  // Track creation
}
```

#### User Data Isolation

Enforce strict user data boundaries at all levels.

**Database Level:**
- All documents include `userId` field
- Firestore security rules enforce user-only access
- No global queries without user filter

**Application Level:**
- Every query includes `where("userId", "==", currentUserId)`
- Services validate user ownership
- Composables check user context

**Firestore Rules Example:**
```javascript
match /transactions/{transactionId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.userId;
}
```

## Project Structure

### Directory Organization

```
src/
├── @schemas/          # Zod validation schemas
│   ├── models/        # Data models (User, Transaction, Category, etc.)
│   └── primitives/    # Reusable validators (stringNotEmpty, etc.)
│
├── @types/            # TypeScript type definitions
│   ├── global/        # Global type declarations
│   └── helpers.ts     # Helper types
│
├── components/        # Vue components
│   ├── [Feature]/     # Feature-specific components (e.g., Transactions/)
│   │   ├── TransactionForm.vue
│   │   ├── TransactionRow.vue
│   │   └── CategorySplitInput.vue
│   └── ui/            # Reusable UI components (shadcn/ui)
│
├── composables/       # Vue composables
│   ├── stores/        # Pinia stores (useXxxStore)
│   │   ├── useUserStore.ts
│   │   └── useFirebaseStore.ts
│   └── useXxx.ts      # Simple composables (useOnboarding.ts)
│
├── helpers/           # Pure utility functions
│   ├── formatDate.ts
│   ├── generateId.ts
│   └── toast/         # Toast helper functions
│
├── layouts/           # Nuxt layouts
│   ├── dashboard.vue
│   └── default.vue
│
├── lib/               # Third-party library configurations
│   └── utils.ts
│
├── middleware/        # Nuxt middleware
│   └── auth.global.ts
│
├── pages/             # Nuxt pages (file-based routing)
│   ├── dashboard/
│   │   ├── index.vue
│   │   ├── transactions/
│   │   └── categories/
│   └── sign-in.vue
│
├── plugins/           # Nuxt plugins
│   ├── firebase.ts
│
├── services/          # Business logic layer
│   ├── api/           # API service methods
│   │   ├── transactions/
│   │   │   ├── create-transaction.ts
│   │   │   ├── update-transaction.ts
│   │   │   └── get-transactions.ts
│   │   └── @handlers/ # Request handlers
│   ├── firebase/      # Firebase utility functions
│   │   ├── firebaseCreate.ts
│   │   └── firebaseList.ts
│   └── analytics/     # Data analysis functions
│       ├── calculate-totals.ts
│       └── group-by-category.ts
│
├── static/            # Static constants and configuration
│   ├── app.ts
│   └── exceptions.ts
│
└── styles/            # Global styles
    ├── components.scss
    └── tailwind.css
```

### Naming Conventions

#### Stores
- **Format:** `useXxxStore`
- **Examples:** `useUserStore`, `useTransactionStore`, `useFirebaseStore`
- **Purpose:** Global state management with Pinia

#### Composables
- **Format:** `useXxx`
- **Examples:** `useUser`, `useTransaction`, `useOnboarding`
- **Purpose:** Shared reactive logic, hooks

#### Components
- **Format:** PascalCase, grouped by feature
- **Examples:** `TransactionForm.vue`, `CategoryBadge.vue`, `BankAccountCard.vue`
- **Organization:** Group related components in feature folders

#### Services
- **Format:** kebab-case files, descriptive function names
- **Examples:** `create-transaction.ts`, `get-bank-accounts.ts`
- **Functions:** `createTransaction()`, `getBankAccounts()`

#### Schemas
- **Format:** Prefix with `z` for Zod schemas
- **Examples:** `zUser`, `zTransaction`, `zCategory`
- **Types:** Infer types from schemas: `type IUser = z.infer<typeof zUser>`

#### Files
- **Constants:** SCREAMING_SNAKE_CASE in files, PascalCase for file names
- **Utilities:** camelCase function names, kebab-case file names
- **Types:** PascalCase for interfaces/types

## Code Organization

### Function Design Principles

#### One Primary Function Per File

Each service file should contain one main exported function, with helper functions kept private if needed.

**Why?**
- Clear file naming matches function purpose
- Easier to locate and import specific functionality
- Better code splitting and tree-shaking
- Simpler testing and maintenance

✅ **Good - One Primary Export:**
```typescript
// services/api/transactions/create-transaction.ts
import { getOrCreateCreditor } from '../creditors/get-or-create-creditor';

// Private helper (not exported)
const validateTransactionData = (data: ICreateTransaction) => {
  // validation logic
};

// Main exported function
export const createTransaction = async (
  data: ICreateTransaction,
  creditorName?: string
): Promise<AppResponse<ITransaction>> => {
  // Use private helper
  validateTransactionData(data);
  
  // Main logic
  // ...
};
```

❌ **Bad - Multiple Public Functions:**
```typescript
// services/api/transactions/transactions.ts - Too generic
export const createTransaction = () => { /* ... */ };
export const updateTransaction = () => { /* ... */ };
export const deleteTransaction = () => { /* ... */ };
export const getTransactions = () => { /* ... */ };
export const validateTransaction = () => { /* ... */ };  // Should be private
```

**File Naming Convention:**
- File name should describe the primary function
- Use kebab-case: `create-transaction.ts`, `get-bank-accounts.ts`
- Name matches main export: `create-transaction.ts` exports `createTransaction`

#### Single Object Parameter Pattern

Functions should accept a single typed object parameter (maximum 2 parameters for simple cases).

**Why?**
- Named parameters improve readability
- Easy to add new parameters without breaking calls
- Self-documenting code
- Flexible parameter ordering
- Better TypeScript autocompletion

✅ **Good - Single Object Parameter:**
```typescript
// Preferred approach
type IGetTransactionsParams = {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryId?: string;
  creditorId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
};

export const getTransactions = async (
  params: IGetTransactionsParams
): Promise<AppResponse<ITransaction[]>> => {
  const { userId, startDate, endDate, categoryId } = params;
  // Implementation
};

// Usage - clear and explicit
const transactions = await getTransactions({
  userId: currentUser.id,
  startDate: startOfMonth,
  categoryId: selectedCategory,
});
```

✅ **Acceptable - Two Parameters (Simple Cases):**
```typescript
// Acceptable when there's one required ID and one data object
export const updateTransaction = async (
  id: string,
  data: IUpdateTransaction
): Promise<AppResponse<ITransaction>> => {
  // Implementation
};

// Usage is still clear
await updateTransaction(transactionId, updateData);
```

❌ **Bad - Multiple Primitive Parameters:**
```typescript
// Hard to read, easy to mix up parameters
export const getTransactions = async (
  userId: string,
  startDate?: Timestamp,
  endDate?: Timestamp,
  categoryId?: string,
  creditorId?: string,
  bankAccountId?: string,
  type?: string
): Promise<AppResponse<ITransaction[]>> => {
  // Implementation
};

// Usage - confusing and error-prone
const transactions = await getTransactions(
  userId,
  undefined,  // What is this?
  endDate,
  undefined,  // What is this?
  creditorId,
  undefined,  // What is this?
  "expense"
);
```

**Benefits in Practice:**

1. **Easier Refactoring:**
```typescript
// Adding a new parameter - non-breaking change
type IGetTransactionsParams = {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  limit?: number;  // New parameter added
};

// All existing calls still work
```

2. **Destructuring for Clean Code:**
```typescript
export const getTransactions = async ({
  userId,
  startDate,
  endDate,
  categoryId,
  creditorId,
  limit = 50,  // Default values
}: IGetTransactionsParams) => {
  // Direct access to named parameters
};
```

3. **Self-Documenting Calls:**
```typescript
// Reader knows exactly what each value represents
await getTransactions({
  userId: user.id,
  startDate: startOfYear,
  endDate: today,
  type: "expense",
});
```

#### Splitting Services and Logic

Separate data access (services) from business logic and transformations.

**Service Layer (API/Data Access):**
- Direct database operations
- API calls
- Data fetching and mutations
- Located in `services/api/`

**Business Logic Layer:**
- Data transformations
- Calculations and analytics
- Business rules
- Located in `services/analytics/` or `helpers/`

**Presentation Layer:**
- Components and composables
- UI state management
- User interactions

✅ **Good - Clear Separation:**
```typescript
// services/api/transactions/get-transactions.ts (Service Layer)
export const getTransactions = async (
  params: IGetTransactionsParams
): Promise<AppResponse<ITransaction[]>> => {
  const firebaseStore = useFirebaseStore();
  
  return await firebaseStore.modelList<ITransaction>({
    collection: "transactions",
    where: buildWhereClause(params),
    orderBy: [{ field: "date", direction: "desc" }],
  });
};

// services/analytics/calculate-totals.ts (Business Logic)
export const calculateTotals = (transactions: ITransaction[]) => {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "deposit") {
      totalIncome += Math.abs(transaction.amount);
    } else {
      totalExpenses += Math.abs(transaction.amount);
    }
  });

  return {
    income: totalIncome,
    expenses: totalExpenses,
    balance: totalIncome - totalExpenses,
  };
};

// components/Dashboard/Overview.vue (Presentation Layer)
const loadData = async () => {
  const result = await getTransactions({ userId: currentUser.value.id });
  if (result.data) {
    const totals = calculateTotals(result.data);
    // Use totals for display
  }
};
```

❌ **Bad - Mixed Concerns:**
```typescript
// services/api/transactions/get-transactions.ts
export const getTransactions = async (userId: string) => {
  // Service logic
  const result = await firebaseStore.modelList(...);
  
  // Business logic mixed in (BAD)
  let totalIncome = 0;
  result.data?.forEach((t) => {
    if (t.type === "deposit") totalIncome += t.amount;
  });
  
  // Formatting logic (BAD)
  const formatted = result.data?.map(t => ({
    ...t,
    formattedAmount: new Intl.NumberFormat().format(t.amount)
  }));
  
  return { data: formatted, totalIncome };
};
```

### Component Guidelines

#### Reusability First

Design components with reusability in mind from the start. Extract common patterns into shared components.

**Identify Reusable Patterns:**
- Forms with similar structures
- List/table displays
- Card layouts
- Modal dialogs
- Filter panels
- Empty states

✅ **Good - Use Existing Form Components:**
```vue
// Use components from /components/Form/
<script setup lang="ts">
import Form from "~/components/Form/index.vue";
import FormField from "~/components/Form/Field/index.vue";
import FormActions from "~/components/Form/actions.vue";

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const form = ref({
  name: "",
  amount: 0,
});

const handleSubmit = () => {
  emit("submit", form.value);
};
</script>

<template>
  <Form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <FormField
        v-model="form.name"
        name="name"
        label="Account Name"
        type="text"
        placeholder="e.g., Main Checking"
        required
      />
      
      <FormField
        v-model="form.amount"
        name="amount"
        label="Initial Balance"
        type="number"
        placeholder="0.00"
      />
    </div>
    
    <FormActions
      :loading="loading"
      submit-label="Save Account"
      @cancel="emit('cancel')"
    />
  </Form>
</template>
```

**Available Form Field Components:**
- `/components/Form/Field/index.vue` - Generic field
- `/components/Form/Field/MultipleSelect.vue` - Multi-select dropdown
- `/components/Form/Field/FileUploaderMultiple.vue` - File uploads
- `/components/Form/Field/ImageUploader.vue` - Image uploads
- `/components/Form/Field/InputWithOptions.vue` - Autocomplete input

**Create new Field components when:**
- Pattern is used 3+ times
- Specialized input type needed
- Place in `/components/Form/Field/`

✅ **Good - Generic Empty State with shadcn/ui:**
```vue
// components/EmptyState.vue
<script setup lang="ts">
import { UiButton } from "~/components/ui/button";

type IProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  showAction?: boolean;
};

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <div class="text-center py-12">
    <div v-if="icon" class="text-6xl mb-4">{{ icon }}</div>
    <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ title }}</h3>
    <p v-if="description" class="text-gray-500 mb-4">
      {{ description }}
    </p>
    <UiButton v-if="showAction" @click="emit('action')" class="bg-pink-400 hover:bg-pink-500">
      {{ actionLabel || 'Get Started' }}
    </UiButton>
  </div>
</template>

// Usage across multiple pages
<EmptyState
  icon="🏦"
  title="No bank accounts yet"
  description="Add your first bank account to start tracking finances"
  action-label="Add Bank Account"
  show-action
  @action="navigateTo('/dashboard/bank-accounts/new')"
/>
```

✅ **Good - Generic Entity List:**
```typescript
// components/EntityList.vue
<script setup lang="ts" generic="T extends { id: string }">
type IProps = {
  items: T[];
  loading?: boolean;
  emptyMessage?: string;
};

const emit = defineEmits<{
  itemClick: [item: T];
  edit: [item: T];
  delete: [item: T];
}>();
</script>

<template>
  <div v-if="loading">Loading...</div>
  
  <div v-else-if="items.length === 0">
    <EmptyState :title="emptyMessage || 'No items found'" />
  </div>
  
  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <slot name="item" v-for="item in items" :item="item" :key="item.id">
      <!-- Default item rendering if no slot provided -->
      <UiCard @click="emit('itemClick', item)">
        <slot name="card-content" :item="item" />
      </UiCard>
    </slot>
  </div>
</template>

// Usage
<EntityList
  :items="bankAccounts"
  :loading="loading"
  empty-message="No bank accounts found"
  @edit="handleEdit"
  @delete="handleDelete"
>
  <template #item="{ item }">
    <BankAccountCard :bank-account="item" />
  </template>
</EntityList>
```

**Component Composition Strategies:**

1. **Slot-Based Composition:**
   - Use slots for flexible content insertion
   - Named slots for specific areas
   - Scoped slots for passing data to parent

2. **Props-Based Configuration:**
   - Use props for behavior customization
   - Provide sensible defaults
   - Keep prop interfaces simple

3. **Event-Based Communication:**
   - Emit semantic events
   - Let parent handle business logic
   - Keep components presentation-focused

4. **Composable-Based Logic Sharing:**
   - Extract reactive logic to composables
   - Share stateful logic across components
   - Keep components thin

**When to Create a Reusable Component:**

✅ **Create reusable component when:**
- Pattern appears 3+ times
- Similar structure with minor variations
- Clear, well-defined responsibility
- Benefits multiple features

⚠️ **Be cautious when:**
- Only 2 uses (may be premature)
- Variations are significantly different
- Would require many conditional props
- Reduces code clarity

❌ **Don't create reusable component for:**
- One-off unique layouts
- Highly specialized logic
- Components that would be over-abstracted

**Size Limits:**
- Maximum 300 lines per component
- If larger, split into sub-components
- Extract complex logic to composables

## Service Functions

**Principles:**
- One primary exported function per file
- Pure functions when possible (no side effects in helpers)
- Single object parameter (or max 2 params)
- Clear input/output types
- Handle errors gracefully
- Private helpers stay within the file

## Checklist for New Features

Before submitting code, verify:

- [ ] **DRY**: No duplicated code. Extracted reusable patterns?
- [ ] **Function Design**: One primary function per file?
- [ ] **Parameters**: Using single object parameter (or max 2)?
- [ ] **Reusability**: Could this component/function be reused elsewhere?
- [ ] **Separation**: Services for data, analytics for logic, components for UI?
- [ ] **Naming**: Clear, descriptive names for files, functions, variables?
- [ ] **Types**: All parameters and returns properly typed?
- [ ] **Testing**: Can this be easily tested?
- [ ] **Documentation**: Complex logic documented with comments?
- [ ] **Anti-patterns**: Checked against the anti-patterns list?

## Conclusion

This constitution serves as the guiding principles for the Personal Finance Manager application. All contributors should familiarize themselves with these guidelines and adhere to them to maintain code quality, consistency, and scalability.

**Remember**: These principles exist to make the codebase:
- **Maintainable**: Easy to update and fix
- **Scalable**: Can grow without becoming unwieldy
- **Readable**: New developers can understand quickly
- **Testable**: Each piece can be verified independently
- **Consistent**: Similar problems solved similarly

**Last Updated:** January 2026
**Version:** 2.0.0
