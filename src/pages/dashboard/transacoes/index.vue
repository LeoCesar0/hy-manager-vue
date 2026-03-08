<script setup lang="ts">
import { PlusIcon, DownloadIcon, UploadIcon } from "lucide-vue-next";
import { Timestamp } from "firebase/firestore";
import type { ITransaction, ICreateTransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import { paginateTransactions } from "~/services/api/transactions/paginate-transactions";
import { deleteTransaction } from "~/services/api/transactions/delete-transaction";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { ROUTE } from "~/static/routes";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import EmptyState from "~/components/Dashboard/EmptyState.vue";
import SummaryCards from "~/components/Transactions/SummaryCards.vue";
import FilterPanel from "~/components/Transactions/FilterPanel.vue";
import TransactionCard from "~/components/Transactions/TransactionCard.vue";
import TransactionsCreateSheet from "~/components/Transactions/CreateSheet.vue";
import TransactionsEditSheet from "~/components/Transactions/EditSheet.vue";
import TransactionsImportSheet from "~/components/Transactions/ImportSheet.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const dashboardStore = useDashboardStore();
const { currentBankAccount, bankAccounts: storeBankAccounts } = storeToRefs(dashboardStore);
const router = useRouter();

const isLoadingData = ref(false);
const transactions = ref<IPaginationResult<ITransaction> | null>(null);
const categories = ref<ICategory[]>([]);
const counterparties = ref<ICounterparty[]>([]);

const bankAccounts = computed(() => storeBankAccounts.value);

const { paginationBody } = usePagination({ limit: 20 })

const filters = ref<{
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  type: 'deposit' | 'expense' | null;
  categoryId: string | null;
  bankAccountId: string | null;
  counterpartyId: string | null;
  search: string;
}>({
  startDate: null,
  endDate: null,
  type: null,
  categoryId: null,
  bankAccountId: null,
  counterpartyId: null,
  search: '',
});

const isCreateSheetOpen = ref(false);
const isUpdateSheetOpen = ref(false);
const isImportSheetOpen = ref(false);
const updatingTransaction = ref<ITransaction | null>(null);

watch(isUpdateSheetOpen, (value) => {
  if (!value) updatingTransaction.value = null;
}, { immediate: true });

const createTransactionInitialValues = computed<ICreateTransaction>(() => ({
  type: 'expense',
  amount: 0,
  description: '',
  date: Timestamp.now(),
  categoryIds: [],
  counterpartyId: null,
  userId: currentUser.value?.id || '',
  bankAccountId: currentBankAccount.value?.id || '',
}));

const allTransactionsForSummary = computed(() => {
  return transactions.value?.list || [];
});

const filteredTransactions = computed(() => {
  let result = transactions.value?.list || [];

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase();
    result = result.filter(t =>
      t.description?.toLowerCase().includes(searchLower)
    );
  }

  return result;
});

const loadAuxiliaryData = async () => {
  if (!currentUser.value) return;

  const [categoriesRes, counterpartiesRes] = await Promise.all([
    getCategories({
      userId: currentUser.value.id,
      options: { toastOptions: undefined },
    }),
    getCounterparties({
      userId: currentUser.value.id,
      options: { toastOptions: undefined },
    }),
  ]);

  if (categoriesRes.data) {
    categories.value = categoriesRes.data;
  }
  if (counterpartiesRes.data) {
    counterparties.value = counterpartiesRes.data;
  }
};

const loadTransactions = async () => {
  if (!currentUser.value) return;

  isLoadingData.value = true;
  try {
    const response = await paginateTransactions({
      userId: currentUser.value.id,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
      type: filters.value.type || undefined,
      categoryId: filters.value.categoryId || undefined,
      bankAccountId: currentBankAccount.value?.id || filters.value.bankAccountId || undefined,
      counterpartyId: filters.value.counterpartyId || undefined,
      pagination: paginationBody.value,
    });

    if (response.data) {
      transactions.value = response.data;
    }
  } finally {
    isLoadingData.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleDelete = (transaction: ITransaction) => {
  openDialog({
    title: "Deletar Transação",
    message: `Tem certeza que deseja deletar esta transação?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        if (!transaction.id) return;
        const response = await deleteTransaction({
          id: transaction.id,
          options: {
            toastOptions: {
              loading: { message: "Deletando transação..." },
              success: { message: "Transação deletada com sucesso!" },
              error: true,
            },
          },
        });
        if (response.data !== undefined) {
          loadTransactions();
        }
      },
    },
  });
};

const handleEdit = (transaction: ITransaction) => {
  updatingTransaction.value = transaction;
  isUpdateSheetOpen.value = true;
};

const handleView = (transaction: ITransaction) => {
  router.push(ROUTE.transactionId.path(transaction.id));
};

const handleCreate = () => {
  isCreateSheetOpen.value = true;
};

const handleCreateSuccess = () => {
  isCreateSheetOpen.value = false;
  loadTransactions();
};

const handleUpdateSuccess = () => {
  updatingTransaction.value = null;
  isUpdateSheetOpen.value = false;
  loadTransactions();
};

const handleApplyFilters = () => {
  paginationBody.value.page = 1;
  loadTransactions();
};

const handleClearFilters = () => {
  loadTransactions();
};

const handleExport = () => {
  const data = filteredTransactions.value;
  if (!data || data.length === 0) {
    return;
  }

  const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Conta', 'Categorias', 'Terceiro'];
  const rows = data.map(t => {
    const categoryNames = categories.value
      .filter(cat => t.categoryIds?.includes(cat.id))
      .map(cat => cat.name)
      .join('; ');

    const bankAccount = bankAccounts.value.find(acc => acc.id === t.bankAccountId);
    const counterparty = counterparties.value.find(cp => cp.id === t.counterpartyId);

    return [
      t.date ? new Date(t.date.toMillis()).toLocaleDateString('pt-BR') : '',
      t.type === 'deposit' ? 'Receita' : 'Despesa',
      t.description || '',
      t.amount.toString(),
      bankAccount?.name || '',
      categoryNames,
      counterparty?.name || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

watch(
  () => paginationBody.value.page,
  () => {
    loadTransactions();
  }
);

watch(
  () => currentBankAccount.value?.id,
  () => {
    paginationBody.value.page = 1;
    loadTransactions();
  }
);

onMounted(() => {
  loadAuxiliaryData();
  loadTransactions();
});
</script>

<template>
  <DashboardSection title="Transações" subtitle="Gerencie suas receitas e despesas"
    :loading="isLoadingData && !transactions">
    <template #actions>
      <UiButton @click="handleExport" variant="outline" :disabled="!filteredTransactions.length">
        <DownloadIcon class="h-4 w-4 mr-2" />
        Exportar
      </UiButton>
      <UiButton @click="isImportSheetOpen = true" variant="outline">
        <UploadIcon class="h-4 w-4 mr-2" />
        Importar
      </UiButton>
      <UiButton @click="handleCreate">
        <PlusIcon class="h-4 w-4 mr-2" />
        Nova Transação
      </UiButton>
    </template>

    <template #filters>
      <SummaryCards :transactions="allTransactionsForSummary" :loading="isLoadingData" />
      <FilterPanel v-model="filters" :categories="categories" :bank-accounts="bankAccounts"
        :counterparties="counterparties" @apply="handleApplyFilters" @clear="handleClearFilters" />
    </template>

    <EmptyState v-if="filteredTransactions.length === 0 && !isLoadingData" title="Nenhuma transação encontrada"
      :description="filters.search || filters.type || filters.categoryId ? 'Tente ajustar os filtros.' : 'Crie sua primeira transação clicando no botão acima.'"
      :show-create-button="!filters.search && !filters.type" create-button-label="Nova Transação"
      :on-create="handleCreate" />

    <div v-else class="space-y-3">
      <TransactionCard v-for="transaction in filteredTransactions" :key="transaction.id" :transaction="transaction"
        :categories="categories" :bank-accounts="bankAccounts" :counterparties="counterparties" :on-view="handleView"
        :on-edit="handleEdit" :on-delete="handleDelete" />
    </div>

    <div v-if="transactions" class="mt-6">
      <TablePagination :pagination-body="paginationBody" :pagination-result="transactions" />
    </div>

    <TransactionsCreateSheet v-model:is-open="isCreateSheetOpen" :initial-values="createTransactionInitialValues"
      :on-success="handleCreateSuccess" :on-cancel="() => { isCreateSheetOpen = false }" />

    <TransactionsEditSheet v-model:is-open="isUpdateSheetOpen" :initial-values="updatingTransaction"
      :on-success="handleUpdateSuccess" :on-cancel="() => { updatingTransaction = null; isUpdateSheetOpen = false }" />

    <TransactionsImportSheet v-model:is-open="isImportSheetOpen"
      :bank-account-id="currentBankAccount?.id || ''"
      :user-id="currentUser?.id || ''"
      :on-success="() => { isImportSheetOpen = false; loadTransactions(); }"
      :on-cancel="() => { isImportSheetOpen = false }" />

    <UiButton class="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg md:hidden z-50" @click="handleCreate">
      <PlusIcon class="h-6 w-6" />
    </UiButton>
  </DashboardSection>
</template>
