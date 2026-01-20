<script setup lang="ts">
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICreditor } from "~/@schemas/models/creditor";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { Timestamp } from "firebase/firestore";
import { getTransactions } from "~/services/api/transactions/get-transactions";
import { deleteTransaction } from "~/services/api/transactions/delete-transaction";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCreditors } from "~/services/api/creditors/get-creditors";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";
import TransactionRow from "~/components/Transactions/TransactionRow.vue";
import TransactionFilters from "~/components/Transactions/TransactionFilters.vue";
import { UiButton } from "~/components/ui/button";
import { useAlertDialog } from "~/composables/ui/useAlertDialog";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const transactions = ref<ITransaction[]>([]);
const categories = ref<ICategory[]>([]);
const creditors = ref<ICreditor[]>([]);
const bankAccounts = ref<IBankAccount[]>([]);
const loading = ref(false);

const loadTransactions = async (filters?: any) => {
  if (!currentUser.value) return;

  loading.value = true;

  const params: any = {
    userId: currentUser.value.id,
  };

  if (filters?.startDate) {
    params.startDate = Timestamp.fromDate(new Date(filters.startDate));
  }
  if (filters?.endDate) {
    params.endDate = Timestamp.fromDate(new Date(filters.endDate));
  }
  if (filters?.categoryId) {
    params.categoryId = filters.categoryId;
  }
  if (filters?.creditorId) {
    params.creditorId = filters.creditorId;
  }
  if (filters?.bankAccountId) {
    params.bankAccountId = filters.bankAccountId;
  }
  if (filters?.type) {
    params.type = filters.type;
  }

  const result = await getTransactions(params);
  loading.value = false;

  if (result.data) {
    transactions.value = result.data;
  }
};

const loadMetadata = async () => {
  if (!currentUser.value) return;

  const [categoriesResult, creditorsResult, bankAccountsResult] = await Promise.all([
    getCategories({ userId: currentUser.value.id }),
    getCreditors({ userId: currentUser.value.id }),
    getBankAccounts({ userId: currentUser.value.id }),
  ]);

  if (categoriesResult.data) categories.value = categoriesResult.data;
  if (creditorsResult.data) creditors.value = creditorsResult.data;
  if (bankAccountsResult.data) bankAccounts.value = bankAccountsResult.data;
};

const getCategoryName = (transaction: ITransaction) => {
  if (transaction.categorySplits && transaction.categorySplits.length > 0) {
    return `${transaction.categorySplits.length} categories`;
  }
  if (transaction.categoryId) {
    const category = categories.value.find((c) => c.id === transaction.categoryId);
    return category?.name || "Unknown";
  }
  return "Uncategorized";
};

const getCreditorName = (transaction: ITransaction) => {
  if (!transaction.creditorId) return "Unknown";
  const creditor = creditors.value.find((c) => c.id === transaction.creditorId);
  return creditor?.name || "Unknown";
};

const getBankAccountName = (transaction: ITransaction) => {
  const account = bankAccounts.value.find((a) => a.id === transaction.bankAccountId);
  return account?.name || "Unknown";
};

const handleEdit = (transaction: ITransaction) => {
  navigateTo(`/dashboard/transactions/${transaction.id}`);
};

const handleDelete = async (transaction: ITransaction) => {
  const confirmed = await useAlertDialog().confirm({
    title: "Delete Transaction",
    description: "Are you sure you want to delete this transaction? This action cannot be undone.",
  });

  if (!confirmed) return;

  const result = await deleteTransaction(transaction.id);

  if (result.error) {
    console.error("Error deleting transaction:", result.error);
    return;
  }

  await loadTransactions();
};

const handleFilter = (filters: any) => {
  loadTransactions(filters);
};

const handleClearFilters = () => {
  loadTransactions();
};

onMounted(() => {
  loadMetadata();
  loadTransactions();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Transactions</h1>
        <p class="text-muted-foreground">View and manage your transactions</p>
      </div>
      <UiButton @click="navigateTo('/dashboard/transactions/new')">
        Add Transaction
      </UiButton>
    </div>

    <TransactionFilters
      :categories="categories"
      :creditors="creditors"
      :bank-accounts="bankAccounts"
      @filter="handleFilter"
      @clear="handleClearFilters"
    />

    <div v-if="loading" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <div v-else-if="transactions.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No transactions found.</p>
      <UiButton class="mt-4" @click="navigateTo('/dashboard/transactions/new')">
        Add Your First Transaction
      </UiButton>
    </div>

    <div v-else class="border rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-muted">
          <tr>
            <th class="p-4 text-left">Date</th>
            <th class="p-4 text-left">Description</th>
            <th class="p-4 text-left">Category</th>
            <th class="p-4 text-left">Account</th>
            <th class="p-4 text-left">Amount</th>
            <th class="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <TransactionRow
            v-for="transaction in transactions"
            :key="transaction.id"
            :transaction="transaction"
            :bank-account-name="getBankAccountName(transaction)"
            :category-name="getCategoryName(transaction)"
            :creditor-name="getCreditorName(transaction)"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>
