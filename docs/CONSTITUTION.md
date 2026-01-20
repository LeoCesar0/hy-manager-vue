# Application Governance & Constitution

This document establishes the architectural principles, coding standards, and best practices for the Personal Finance Manager application.

## Core Principles

### 1. Data Storage Principles

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

### Component Guidelines

**Size Limits:**
- Maximum 300 lines per component
- If larger, split into sub-components
- Extract complex logic to composables

**Structure:**
```vue
<script setup lang="ts">
// 1. Imports
import { ref } from 'vue';
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
  <!-- Clean, semantic HTML -->
</template>

<style scoped>
  /* Component-specific styles */
</style>
```

### Service Functions

**Principles:**
- One function per file
- Pure functions when possible
- Clear input/output types
- Handle errors gracefully

**Example:**
```typescript
// src/services/api/transactions/create-transaction.ts
import type { ITransaction, ICreateTransaction } from '~/@schemas/models/transaction';
import type { AppResponse } from '~/@schemas/app';

export const createTransaction = async (
  data: ICreateTransaction,
  creditorName?: string
): Promise<AppResponse<ITransaction>> => {
  // Implementation
};
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

### CSS
- Use Tailwind utility classes
- Scoped styles for components
- Use CSS variables for theming
- Follow mobile-first approach

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

## Conclusion

This constitution serves as the guiding principles for the Personal Finance Manager application. All contributors should familiarize themselves with these guidelines and adhere to them to maintain code quality, consistency, and scalability.

**Last Updated:** January 2026
**Version:** 1.0.0
