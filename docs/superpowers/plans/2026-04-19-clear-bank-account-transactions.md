# Clear Bank Account Transactions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a button on the transactions page to delete all transactions from the selected bank account and reset its report.

**Architecture:** New internal sync service `clear-bank-account-transactions.ts` handles batch deletion (reusing `cascadeDeleteBankAccount` pattern). A UI-facing service wraps it with `handleAppRequest`. The button lives in `TransactionListSection.vue` header alongside export/import, and uses the existing `useAlertDialog` for a destructive confirmation dialog.

**Tech Stack:** Vue 3, Firebase/Firestore batch operations, shadcn-vue components, lucide-vue-next icons

---

## Chunk 1: Service Layer + UI Integration

### Task 1: Create the internal sync service

**Files:**
- Create: `src/services/api/sync/clear-bank-account-transactions.ts`

This service follows the exact same pattern as `cascade-delete-bank-account.ts` — it lists all transactions for the account, batch-deletes them, and deletes the report document.

- [ ] **Step 1: Create the sync service**

```typescript
import { writeBatch } from "firebase/firestore";
import type { ITransaction } from "~/@schemas/models/transaction";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseDeleteMany } from "~/services/firebase/firebaseDeleteMany";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";

type IProps = {
  bankAccountId: string;
  userId: string;
};

export const clearBankAccountTransactions = async ({ bankAccountId, userId }: IProps) => {
  const { firebaseDB } = useFirebaseStore();

  const transactions = await firebaseList<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "bankAccountId", operator: "==", value: bankAccountId },
    ],
  });

  const batch = writeBatch(firebaseDB);

  if (transactions.length > 0) {
    await firebaseDeleteMany({
      collection: "transactions",
      ids: transactions.map((t) => t.id),
      batch,
    });
  }

  await firebaseDelete({
    collection: "reports",
    id: bankAccountId,
    batch,
  });

  await batch.commit();
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/api/sync/clear-bank-account-transactions.ts
git commit -m "feat: add clear-bank-account-transactions sync service"
```

---

### Task 2: Create the UI-facing API service

**Files:**
- Create: `src/services/api/transactions/clear-transactions.ts`

This wraps the sync service with `handleAppRequest` for toast and loading state, following the same pattern as `delete-transaction.ts`.

- [ ] **Step 1: Create the API service**

```typescript
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { clearBankAccountTransactions } from "../sync/clear-bank-account-transactions";

export type IAPIClearTransactions = {
  bankAccountId: string;
  userId: string;
} & IAPIRequestCommon<void>;

export const clearTransactions = async ({
  bankAccountId,
  userId,
  options,
}: IAPIClearTransactions) => {
  const response = await handleAppRequest(
    async () => {
      await clearBankAccountTransactions({ bankAccountId, userId });
    },
    {
      toastOptions: {
        loading: { message: "Limpando transações..." },
        success: { message: "Transações limpas com sucesso!" },
        error: { message: "Falha ao limpar transações" },
      },
      ...options,
    }
  );
  return response;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/api/transactions/clear-transactions.ts
git commit -m "feat: add clear-transactions UI-facing API service"
```

---

### Task 3: Add button and handler to TransactionListSection

**Files:**
- Modify: `src/components/Transactions/TransactionListSection.vue`

Add the clear button in the header actions bar (alongside Export/Import), add the `Trash2Icon` import, and create the `handleClearTransactions` handler with destructive confirmation dialog.

- [ ] **Step 1: Add import for icon and service**

Add to the imports at the top of `<script setup>`:

```typescript
import { Trash2Icon } from "lucide-vue-next";  // add to existing lucide import
import { clearTransactions } from "~/services/api/transactions/clear-transactions";
```

- [ ] **Step 2: Add the handler function**

Add after the `handleDelete` function (after line 192):

```typescript
const handleClearTransactions = () => {
  if (!currentUser.value || !currentBankAccount.value) return;

  const bankAccountName = currentBankAccount.value.name;
  const bankAccountId = currentBankAccount.value.id;
  const userId = currentUser.value.id;

  openDialog({
    title: "Limpar Transações",
    message: `Todas as transações da conta "${bankAccountName}" serão deletadas permanentemente. Esta ação é irreversível.`,
    confirm: {
      label: "Limpar Tudo",
      variant: "destructive",
      action: async () => {
        const response = await clearTransactions({
          bankAccountId,
          userId,
        });
        if (response.data !== undefined) {
          loadTransactions();
        }
      },
    },
  });
};
```

- [ ] **Step 3: Add button to the template**

Add the clear button before the Export button in the actions bar (inside the `v-if="showActions"` div):

```html
<UiButton @click="handleClearTransactions" variant="outline" class="text-destructive hover:text-destructive" :disabled="!transactionsList.length">
  <Trash2Icon class="h-4 w-4 mr-2" />
  Limpar
</UiButton>
```

- [ ] **Step 4: Verify dev server runs without errors**

Run: `pnpm run dev`
Expected: No compilation errors

- [ ] **Step 5: Commit**

```bash
git add src/components/Transactions/TransactionListSection.vue
git commit -m "feat: add clear transactions button with destructive confirmation dialog"
```
