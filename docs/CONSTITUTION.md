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

**Query Pattern:**
```typescript
where: [
  { field: "userId", operator: "==", value: userId },
  { field: "deletedAt", operator: "==", value: null }
]
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
│   └── apexcharts.ts
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

**Structure:**
```vue
<script setup lang="ts">
// 1. Imports - shadcn/ui components first
import { UiButton } from "~/components/ui/button";
import { UiCard, UiCardContent } from "~/components/ui/card";
import type { ITransaction } from '~/@schemas/models/transaction';

// 2. Type definitions
type IProps = { ... };

// 3. Props and emits
const props = defineProps<IProps>();
const emit = defineEmits<{ ... }>();

// 4. Composables and stores
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

// 5. Reactive state
const loading = ref(false);

// 6. Computed properties
const formattedAmount = computed(() => ...);

// 7. Functions
const handleSubmit = () => { ... };

// 8. Lifecycle hooks
onMounted(() => { ... });
</script>

<template>
  <!-- Use shadcn/ui components with Tailwind classes -->
  <UiCard class="hover:shadow-md transition-shadow">
    <UiCardContent class="space-y-4">
      <!-- Content with Tailwind utilities -->
    </UiCardContent>
  </UiCard>
</template>

<style scoped lang="scss">
  /* Avoid custom styles - use Tailwind classes instead */
  /* Only add styles here if absolutely necessary */
</style>
```

### Service Functions

**Principles:**
- One primary exported function per file
- Pure functions when possible (no side effects in helpers)
- Single object parameter (or max 2 params)
- Clear input/output types
- Handle errors gracefully
- Private helpers stay within the file

**Good Examples:**

```typescript
// src/services/api/transactions/create-transaction.ts
import type { ITransaction, ICreateTransaction } from '~/@schemas/models/transaction';
import type { AppResponse } from '~/@schemas/app';
import { getOrCreateCreditor } from '../creditors/get-or-create-creditor';

// Private helper - not exported
const extractCategoryIds = (data: ICreateTransaction): string[] => {
  return data.categorySplits?.map((s) => s.categoryId) || [];
};

// Main exported function - single object parameter
export const createTransaction = async ({
  data,
  creditorName,
}: {
  data: ICreateTransaction;
  creditorName?: string;
}): Promise<AppResponse<ITransaction>> => {
  const firebaseStore = useFirebaseStore();
  
  let creditorId = data.creditorId;

  if (creditorName && !creditorId) {
    const categoryIds = extractCategoryIds(data);
    const creditorResult = await getOrCreateCreditor({
      name: creditorName,
      userId: data.userId,
      categoryIds,
    });

    if (creditorResult.data) {
      creditorId = creditorResult.data.id;
    }
  }

  return await firebaseStore.modelCreate<ICreateTransaction, ITransaction>({
    collection: "transactions",
    data: { ...data, creditorId: creditorId || null },
  });
};
```

**Alternative - Acceptable Two Parameter Pattern:**
```typescript
// When there's clearly one ID and one data object
export const updateTransaction = async (
  id: string,
  data: IUpdateTransaction
): Promise<AppResponse<ITransaction>> => {
  const firebaseStore = useFirebaseStore();
  
  return await firebaseStore.modelUpdate<IUpdateTransaction, ITransaction>({
    collection: "transactions",
    id,
    data,
  });
};
```

**File Organization for Related Services:**

```
services/api/transactions/
├── create-transaction.ts      # One function: createTransaction
├── update-transaction.ts      # One function: updateTransaction
├── delete-transaction.ts      # One function: deleteTransaction
├── get-transactions.ts        # One function: getTransactions
└── get-transaction-by-id.ts   # One function: getTransactionById
```

**NOT like this:**
```
services/api/
└── transactions.ts  # BAD: Contains all transaction functions
```

### Schema Definitions

**Pattern:**
```typescript
// Base schema for creation
export const zTransactionBase = z.object({
  id: z.string().optional(),
  amount: z.coerce.number(),
  // ... other fields
});

// Full schema with common fields
export const zTransaction = zTransactionBase.extend(zCommonDoc.shape);

// Type inference
export type ITransaction = z.infer<typeof zTransaction>;
export type ICreateTransaction = z.infer<typeof zTransactionBase>;
```

## State Management

### When to Use What

**Pinia Stores (Global State):**
- User authentication state
- Firebase connection
- App-wide configuration
- Shared data across routes

**Composables (Shared Logic):**
- Reusable reactive logic
- Business logic hooks
- Form handling
- Data fetching patterns

**Component State (Local State):**
- Form inputs
- UI toggle states
- Component-specific data
- Temporary state

### Store Pattern

```typescript
export const useXxxStore = defineStore(makeStoreKey("xxx"), () => {
  // State
  const data = ref<IData | null>(null);
  const loading = ref(false);

  // Getters (computed)
  const hasData = computed(() => !!data.value);

  // Actions (functions)
  const fetchData = async () => {
    loading.value = true;
    // ... fetch logic
    loading.value = false;
  };

  return {
    // State
    data,
    loading,
    // Getters
    hasData,
    // Actions
    fetchData,
  };
});
```

### Using Stores

```typescript
// In components
const xxxStore = useXxxStore();
const { data, loading } = storeToRefs(xxxStore); // Reactive refs
xxxStore.fetchData(); // Call actions directly
```

## Error Handling

### Request Handler Pattern

All Firebase operations should be wrapped in `handleAppRequest`:

```typescript
import { handleAppRequest } from '~/services/api/@handlers/handle-app-request';

const result = await handleAppRequest(
  () => firebaseCreate({ ... }),
  {
    loadingRefs: [loading],
    toastOptions: {
      loading: { message: "Creating..." },
      success: { message: "Created successfully!" },
      error: { message: "Failed to create" },
    },
    onSuccess: (data) => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    },
  }
);
```

### Error Types

**Handle gracefully:**
- Network errors
- Permission denied
- Validation errors
- Not found errors

**User Feedback:**
- Toast notifications for operations
- Inline errors for forms
- Error boundaries for crashes
- Proper error logging

## Testing Strategy (Future)

### Unit Tests
- Test helpers and utilities
- Test pure functions
- Test validation schemas
- Aim for 70%+ coverage

### Integration Tests
- Test service functions
- Test Firebase interactions
- Test composables
- Mock external dependencies

### E2E Tests
- Test critical user flows
- Test authentication
- Test transaction creation
- Test data visualization

### Tools
- Vitest for unit tests
- Playwright for E2E tests
- Firebase Emulator for local testing

## Performance Considerations

### Firebase Queries
- Always filter by userId first
- Use indexes for complex queries
- Limit results with pagination
- Cache frequently accessed data

### Component Rendering
- Use `v-memo` for expensive lists
- Lazy load components
- Virtual scrolling for long lists
- Debounce user inputs

### Bundle Size
- Code splitting by route
- Lazy import large libraries
- Tree-shake unused code
- Optimize images

## Security Best Practices

### Authentication
- Use Firebase Auth
- Implement proper session management
- Secure token storage
- Validate on both client and server

### Data Validation
- Validate all inputs with Zod
- Sanitize user inputs
- Type-check everything
- Never trust client data

### Firestore Rules
- Enforce user isolation
- Validate data structure
- Limit read/write operations
- Log security events

## Anti-Patterns to Avoid

Understanding what NOT to do is just as important as knowing best practices.

### 1. Avoid Multiple Primitive Parameters

❌ **Bad:**
```typescript
const createTransaction = (
  amount: number,
  description: string,
  date: Date,
  userId: string,
  categoryId: string,
  creditorId: string
) => { /* ... */ };

// Confusing - which parameter is which?
createTransaction(100, "Groceries", new Date(), userId, catId, credId);
```

✅ **Good:**
```typescript
type ICreateTransactionParams = {
  amount: number;
  description: string;
  date: Date;
  userId: string;
  categoryId?: string;
  creditorId?: string;
};

const createTransaction = (params: ICreateTransactionParams) => { /* ... */ };

// Clear and self-documenting
createTransaction({
  amount: 100,
  description: "Groceries",
  date: new Date(),
  userId,
  categoryId: catId,
});
```

### 2. Avoid God Files/Components

❌ **Bad:**
```typescript
// services/transactions.ts - 2000 lines with everything
export const createTransaction = () => {};
export const updateTransaction = () => {};
export const deleteTransaction = () => {};
export const getTransactions = () => {};
export const calculateTotals = () => {};
export const formatTransaction = () => {};
export const validateTransaction = () => {};
// ... 50 more functions
```

✅ **Good:**
```typescript
// services/api/transactions/create-transaction.ts
export const createTransaction = () => {};

// services/api/transactions/get-transactions.ts
export const getTransactions = () => {};

// services/analytics/calculate-totals.ts
export const calculateTotals = () => {};

// helpers/formatTransaction.ts
export const formatTransaction = () => {};
```

### 3. Avoid Inline Styles and Repeated Classes

❌ **Bad:**
```vue
<template>
  <!-- Repeated utility classes everywhere -->
  <div class="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white">
    <span class="text-sm font-medium text-gray-700">Label</span>
    <span class="text-base font-bold text-gray-900">Value</span>
  </div>
  
  <!-- Same pattern elsewhere -->
  <div class="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white">
    <span class="text-sm font-medium text-gray-700">Another Label</span>
    <span class="text-base font-bold text-gray-900">Another Value</span>
  </div>
</template>
```

✅ **Good:**
```vue
<!-- components/DataRow.vue -->
<template>
  <div class="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white">
    <span class="text-sm font-medium text-gray-700">
      <slot name="label" />
    </span>
    <span class="text-base font-bold text-gray-900">
      <slot name="value" />
    </span>
  </div>
</template>

<!-- Usage -->
<DataRow>
  <template #label>Label</template>
  <template #value>Value</template>
</DataRow>
```

### 4. Avoid Mixing Concerns

❌ **Bad - Service with Business Logic:**
```typescript
// services/api/get-transactions.ts
export const getTransactions = async (userId: string) => {
  // Data fetching (correct)
  const result = await firebaseStore.modelList<ITransaction>({
    collection: "transactions",
    where: [{ field: "userId", operator: "==", value: userId }],
  });
  
  // Business logic (WRONG - doesn't belong here)
  const total = result.data?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const formatted = result.data?.map(t => ({
    ...t,
    displayAmount: `$${t.amount.toFixed(2)}`  // Formatting (WRONG)
  }));
  
  return { transactions: formatted, total };
};
```

✅ **Good - Separated Concerns:**
```typescript
// services/api/transactions/get-transactions.ts (Data Access)
export const getTransactions = async ({ userId }: { userId: string }) => {
  return await firebaseStore.modelList<ITransaction>({
    collection: "transactions",
    where: [{ field: "userId", operator: "==", value: userId }],
  });
};

// services/analytics/calculate-total.ts (Business Logic)
export const calculateTotal = (transactions: ITransaction[]) => {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
};

// helpers/formatCurrency.ts (Formatting)
export const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`;
};

// In component (Composition)
const result = await getTransactions({ userId });
if (result.data) {
  const total = calculateTotal(result.data);
  const displayTotal = formatCurrency(total);
}
```

### 5. Avoid Premature Abstraction

❌ **Bad - Over-Engineering:**
```typescript
// Created after only 1 use - premature abstraction
export const useGenericCrudOperations = <T>(
  collection: string,
  schema: ZodSchema,
  validators: Record<string, Function>,
  transformers: Record<string, Function>,
  hooks: Record<string, Function>
) => {
  // 500 lines of complex generic code
  // Hard to understand and maintain
};
```

✅ **Good - Gradual Abstraction:**
```typescript
// Start with specific implementations
export const useBankAccountCrud = () => { /* specific logic */ };
export const useCategoryCrud = () => { /* specific logic */ };

// After seeing 3+ similar patterns, then abstract:
export const useEntityCrud = <T>(collection: string) => {
  // Simple, clear abstraction of common pattern
  const items = ref<T[]>([]);
  const loading = ref(false);
  
  const loadItems = async (userId: string) => {
    loading.value = true;
    const result = await firebaseStore.modelList<T>({
      collection,
      where: [{ field: "userId", operator: "==", value: userId }],
    });
    items.value = result.data ?? [];
    loading.value = false;
  };
  
  return { items, loading, loadItems };
};
```

### 6. Avoid Unclear Variable/Function Names

❌ **Bad:**
```typescript
const getData = async () => {};  // What data?
const handleClick = () => {};    // Handle which click?
const process = () => {};        // Process what?
const temp = [];                 // Temp what?
const x = 100;                   // What is x?
```

✅ **Good:**
```typescript
const getTransactions = async () => {};
const handleDeleteTransaction = () => {};
const processPaymentSchedule = () => {};
const pendingTransactions = [];
const maxRetryAttempts = 100;
```

### 7. Avoid Magic Numbers and Strings

❌ **Bad:**
```typescript
if (user.status === "active") {  // Magic string
  const timeout = 3600000;        // Magic number - what is this?
  setTimeout(doSomething, timeout);
}

if (transaction.amount > 1000) { // Why 1000?
  sendAlert();
}
```

✅ **Good:**
```typescript
// static/constants.ts
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export const TIMEOUTS = {
  SESSION_DURATION_MS: 60 * 60 * 1000, // 1 hour
  API_TIMEOUT_MS: 5000,                 // 5 seconds
} as const;

export const TRANSACTION_LIMITS = {
  LARGE_TRANSACTION_THRESHOLD: 1000,
  MAX_TRANSACTION_AMOUNT: 1_000_000,
} as const;

// Usage
if (user.status === USER_STATUS.ACTIVE) {
  setTimeout(doSomething, TIMEOUTS.SESSION_DURATION_MS);
}

if (transaction.amount > TRANSACTION_LIMITS.LARGE_TRANSACTION_THRESHOLD) {
  sendAlert();
}
```

### 8. Avoid Deeply Nested Code

❌ **Bad:**
```typescript
const processTransaction = async (data) => {
  if (data) {
    if (data.userId) {
      const user = await getUser(data.userId);
      if (user) {
        if (user.isActive) {
          const account = await getBankAccount(data.accountId);
          if (account) {
            if (account.balance > data.amount) {
              // Finally do something
            }
          }
        }
      }
    }
  }
};
```

✅ **Good - Early Returns:**
```typescript
const processTransaction = async (data: ITransactionData) => {
  if (!data?.userId) return;
  
  const user = await getUser(data.userId);
  if (!user?.isActive) return;
  
  const account = await getBankAccount(data.accountId);
  if (!account || account.balance < data.amount) return;
  
  // Do something
};
```

## Code Style

### TypeScript
- Enable strict mode
- Use explicit return types
- Avoid `any` type
- Prefer interfaces over types for objects

### Vue
- Use `<script setup>` syntax
- Use Composition API
- Type props and emits
- Use `defineProps` and `defineEmits` with types
- Import shadcn/ui components from `/components/ui/`
- Use Form components from `/components/Form/` for all forms

### CSS & Styling
- **Always use Tailwind utility classes** - avoid custom CSS
- Never write inline styles - use Tailwind classes
- Use shadcn/ui component classes as base
- Scoped styles only when absolutely necessary
- Follow mobile-first approach (`sm:`, `md:`, `lg:` prefixes)
- Use Tailwind's design tokens (colors, spacing, typography)

### UI Components
- **Always use shadcn/ui components** from `/components/ui/`
- Import from: `~/components/ui/button`, `~/components/ui/card`, etc.
- Don't create custom buttons, inputs, or form controls
- Extend shadcn/ui components with Tailwind classes
- Use Form system from `/components/Form/` for complex forms

### Formatting
- Use Prettier (if configured)
- Consistent indentation
- Clear variable names
- Comments for complex logic

## Documentation

### Code Comments
- Explain "why", not "what"
- Document complex algorithms
- Add JSDoc for public APIs
- Keep comments updated

### README Files
- Setup instructions
- Environment variables
- Development workflow
- Deployment process

### API Documentation
- Document service functions
- Specify input/output types
- Provide usage examples
- Note breaking changes

## Version Control

### Git Workflow
- Meaningful commit messages
- Feature branches
- Pull request reviews
- Semantic versioning

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### Branch Naming
- `feature/feature-name`
- `fix/bug-description`
- `docs/documentation-update`
- `refactor/code-improvement`

## Deployment

### Environment Variables
- Never commit secrets
- Use `.env` files locally
- Configure in hosting platform
- Document all required variables

### Build Process
1. Run linter
2. Run type checks
3. Run tests
4. Build production bundle
5. Deploy to hosting

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Server logs

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and optimize queries
- Clean up unused code
- Update documentation

### Breaking Changes
- Deprecation warnings
- Migration guides
- Version compatibility
- Backward compatibility when possible

## Real-World Examples from the Codebase

### Example 1: Transaction Creation Service

Following the principles outlined in this constitution:

```typescript
// services/api/transactions/create-transaction.ts

// ✅ Single object parameter
type ICreateTransactionParams = {
  data: ICreateTransaction;
  creditorName?: string;
};

// ✅ One primary function per file
export const createTransaction = async ({
  data,
  creditorName,
}: ICreateTransactionParams): Promise<AppResponse<ITransaction>> => {
  const firebaseStore = useFirebaseStore();

  let creditorId = data.creditorId;

  // ✅ Separated concern - creditor logic extracted to its own service
  if (creditorName && !creditorId) {
    const categoryIds = data.categorySplits?.map((s) => s.categoryId) || [];
    const creditorResult = await getOrCreateCreditor({
      name: creditorName,
      userId: data.userId,
      categoryIds: categoryIds.filter((id) => id),
    });

    if (creditorResult.data) {
      creditorId = creditorResult.data.id;
    }
  }

  const transactionData = {
    ...data,
    creditorId: creditorId || null,
  };

  return await firebaseStore.modelCreate<ICreateTransaction, ITransaction>({
    collection: "transactions",
    data: transactionData,
  });
};
```

### Example 2: Reusable Category Badge Component

```vue
<!-- components/Categories/CategoryBadge.vue -->
<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";

// ✅ Clear, typed props
type IProps = {
  category: ICategory;
};

const props = defineProps<IProps>();

// ✅ Computed for derived state
const badgeStyle = computed(() => {
  if (!props.category.color) return {};
  return {
    backgroundColor: props.category.color + "20",
    color: props.category.color,
    borderColor: props.category.color,
  };
});
</script>

<template>
  <!-- ✅ Reusable component used across multiple features -->
  <UiBadge :style="badgeStyle" variant="outline">
    <span v-if="category.icon" class="mr-1">{{ category.icon }}</span>
    {{ category.name }}
  </UiBadge>
</template>
```

### Example 3: Analytics Service (Business Logic)

```typescript
// services/analytics/calculate-totals.ts

// ✅ One pure function per file
// ✅ Separated from data fetching
// ✅ Single object parameter
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
```

### Example 4: Component Using the Principles

```vue
<!-- pages/dashboard/transactions/new.vue -->
<script setup lang="ts">
import type { ICreateTransaction } from "~/@schemas/models/transaction";

// ✅ Reusing components
import TransactionForm from "~/components/Transactions/TransactionForm.vue";

const router = useRouter();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const loading = ref(false);
const bankAccounts = ref<IBankAccount[]>([]);
const categories = ref<ICategory[]>([]);
const creditors = ref<ICreditor[]>([]);

// ✅ Clear function names
const loadMetadata = async () => {
  if (!currentUser.value) return;

  // ✅ Using service functions (not inline queries)
  const [bankAccountsResult, categoriesResult, creditorsResult] = await Promise.all([
    getBankAccounts({ userId: currentUser.value.id }),
    getCategories({ userId: currentUser.value.id }),
    getCreditors({ userId: currentUser.value.id }),
  ]);

  if (bankAccountsResult.data) bankAccounts.value = bankAccountsResult.data;
  if (categoriesResult.data) categories.value = categoriesResult.data;
  if (creditorsResult.data) creditors.value = creditorsResult.data;
};

// ✅ Single object parameter pattern
const handleSubmit = async (data: ICreateTransaction, creditorName?: string) => {
  loading.value = true;
  const result = await createTransaction({ data, creditorName });
  loading.value = false;

  if (result.error) {
    console.error("Error creating transaction:", result.error);
    return;
  }

  router.push("/dashboard/transactions");
};

onMounted(() => {
  loadMetadata();
});
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- ✅ Reusable card components -->
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Transaction Details</UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <!-- ✅ Reusable form component -->
        <TransactionForm
          :loading="loading"
          :bank-accounts="bankAccounts"
          :categories="categories"
          :creditors="creditors"
          @submit="handleSubmit"
          @cancel="() => router.push('/dashboard/transactions')"
        />
      </UiCardContent>
    </UiCard>
  </div>
</template>
```

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
