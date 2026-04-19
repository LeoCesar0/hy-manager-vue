<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import { PlusIcon, DownloadIcon, UploadIcon, ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-vue-next";
import { Timestamp } from "firebase/firestore";
import type { ITransaction, ICreateTransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IPaginationResult } from "~/@types/pagination";
import { paginateTransactions } from "~/services/api/transactions/paginate-transactions";
import { deleteTransaction } from "~/services/api/transactions/delete-transaction";
import { clearTransactions } from "~/services/api/transactions/clear-transactions";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { ROUTE } from "~/static/routes";
import EmptyState from "~/components/Dashboard/EmptyState.vue";
import SummaryCards from "~/components/Transactions/SummaryCards.vue";
import FilterPanel from "~/components/Transactions/FilterPanel.vue";
import TransactionCard from "~/components/Transactions/TransactionCard.vue";
import TransactionsCreateSheet from "~/components/Transactions/CreateSheet.vue";
import TransactionsEditSheet from "~/components/Transactions/EditSheet.vue";
import TransactionsImportSheet from "~/components/Transactions/ImportSheet.vue";

type IProps = {
  fixedCounterpartyId?: string;
  showSummaryCards?: boolean;
  showActions?: boolean;
  showFab?: boolean;
  hiddenFilters?: string[];
  paginationQueryKey?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  showSummaryCards: true,
  showActions: true,
  showFab: true,
  paginationQueryKey: 'page',
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

const { paginationBody } = usePagination({
  limit: 20,
  orderBy: { field: 'date', direction: 'desc' },
  queryKey: props.paginationQueryKey,
});

const filters = ref<{
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  type: 'deposit' | 'expense' | null;
  categoryIds: string[];
  counterpartyId: string | null;
  search: string;
}>({
  startDate: null,
  endDate: null,
  type: null,
  categoryIds: [],
  counterpartyId: null,
  search: '',
});

const computedHiddenFilters = computed(() => {
  const hidden = [...(props.hiddenFilters || [])];
  if (props.fixedCounterpartyId && !hidden.includes('counterparty')) {
    hidden.push('counterparty');
  }
  return hidden;
});

const sortDirection = computed(() => paginationBody.value.orderBy?.direction ?? 'desc');

const toggleSortDirection = () => {
  const newDirection = sortDirection.value === 'desc' ? 'asc' : 'desc';
  paginationBody.value.orderBy = { field: 'date', direction: newDirection };
  paginationBody.value.page = 1;
  loadTransactions();
};

const pageSizeOptions = [10, 20, 30] as const;

const handlePageSizeChange = (value: unknown) => {
  paginationBody.value.limit = Number(String(value));
  paginationBody.value.page = 1;
  loadTransactions();
};

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
  counterpartyId: props.fixedCounterpartyId || null,
  userId: currentUser.value?.id || '',
  bankAccountId: currentBankAccount.value?.id || '',
}));

const transactionsList = computed(() => transactions.value?.list || []);

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
      search: filters.value.search || undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
      type: filters.value.type || undefined,
      categoryIds: filters.value.categoryIds.length > 0 ? filters.value.categoryIds : undefined,
      bankAccountId: currentBankAccount.value?.id || undefined,
      counterpartyId: props.fixedCounterpartyId || filters.value.counterpartyId || undefined,
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
        if (!response.error) {
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
  const data = transactionsList.value;
  if (!data || data.length === 0) {
    return;
  }

  const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Conta', 'Categorias', 'Identificador'];
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

watchDebounced(
  () => filters.value.search,
  () => {
    paginationBody.value.page = 1;
    loadTransactions();
  },
  { debounce: 400 }
);

onMounted(() => {
  loadAuxiliaryData();
  loadTransactions();
});
</script>

<template>
  <div class="space-y-6">
    <div v-if="showActions" class="flex items-center gap-2 justify-end">
      <UiButton @click="handleClearTransactions" variant="outline" class="text-destructive hover:text-destructive" :disabled="!transactionsList.length">
        <Trash2Icon class="h-4 w-4 mr-2" />
        Limpar
      </UiButton>
      <UiButton @click="handleExport" variant="outline" :disabled="!transactionsList.length">
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
    </div>

    <SummaryCards v-if="showSummaryCards" :transactions="transactionsList" :loading="isLoadingData" />

    <FilterPanel
      v-model="filters"
      :categories="categories"
      :counterparties="counterparties"
      :hidden-filters="computedHiddenFilters"
      @apply="handleApplyFilters"
      @clear="handleClearFilters"
    />

    <div class="flex items-center gap-3">
      <UiButton variant="outline" size="sm" @click="toggleSortDirection">
        <ArrowDownIcon v-if="sortDirection === 'desc'" class="h-4 w-4 mr-2" />
        <ArrowUpIcon v-else class="h-4 w-4 mr-2" />
        {{ sortDirection === 'desc' ? 'Mais recentes' : 'Mais antigos' }}
      </UiButton>

      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">Exibir</span>
        <UiSelect
          :model-value="String(paginationBody.limit)"
          @update:model-value="handlePageSizeChange"
        >
          <UiSelectTrigger class="w-[70px] h-8">
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem v-for="size in pageSizeOptions" :key="size" :value="String(size)">
              {{ size }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
        <span class="text-sm text-muted-foreground">por página</span>
      </div>
    </div>

    <div v-if="isLoadingData && !transactions" class="flex items-center justify-center py-12">
      <Loading :is-loading="true" size="lg" />
    </div>

    <template v-else>
      <EmptyState
        v-if="transactionsList.length === 0 && !isLoadingData"
        title="Nenhuma transação encontrada"
        :description="filters.search || filters.type || filters.categoryIds.length > 0 ? 'Tente ajustar os filtros.' : 'Crie sua primeira transação clicando no botão acima.'"
        :show-create-button="showActions && !filters.search && !filters.type"
        create-button-label="Nova Transação"
        :on-create="handleCreate"
      />

      <div v-else class="space-y-3">
        <TransactionCard
          v-for="transaction in transactionsList"
          :key="transaction.id"
          :transaction="transaction"
          :categories="categories"
          :bank-accounts="bankAccounts"
          :counterparties="counterparties"
          :on-view="handleView"
          :on-edit="handleEdit"
          :on-delete="handleDelete"
        />
      </div>

      <div v-if="transactions" class="mt-6">
        <TablePagination :pagination-body="paginationBody" :pagination-result="transactions" />
      </div>
    </template>

    <TransactionsCreateSheet
      v-model:is-open="isCreateSheetOpen"
      :initial-values="createTransactionInitialValues"
      :on-success="handleCreateSuccess"
      :on-cancel="() => { isCreateSheetOpen = false }"
    />

    <TransactionsEditSheet
      v-model:is-open="isUpdateSheetOpen"
      :initial-values="updatingTransaction"
      :on-success="handleUpdateSuccess"
      :on-cancel="() => { updatingTransaction = null; isUpdateSheetOpen = false }"
    />

    <TransactionsImportSheet
      v-if="showActions"
      v-model:is-open="isImportSheetOpen"
      :bank-account-id="currentBankAccount?.id || ''"
      :user-id="currentUser?.id || ''"
      :on-success="() => { isImportSheetOpen = false; loadTransactions(); }"
      :on-cancel="() => { isImportSheetOpen = false }"
    />

    <UiButton
      v-if="showFab"
      class="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg md:hidden z-50"
      @click="handleCreate"
    >
      <PlusIcon class="h-6 w-6" />
    </UiButton>
  </div>
</template>
