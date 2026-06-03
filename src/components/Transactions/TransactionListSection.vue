<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import { PlusIcon, DownloadIcon, UploadIcon, ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-vue-next";
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { ITransaction, ICreateTransaction } from "~/@schemas/models/transaction";
import { paginateTransactions } from "~/services/api/transactions/paginate-transactions";
import type { ICursorPaginationResult } from "~/services/api/transactions/paginate-transactions";
import { deleteTransaction } from "~/services/api/transactions/delete-transaction";
import { clearTransactions } from "~/services/api/transactions/clear-transactions";
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

const referenceDataStore = useReferenceDataStore();
const { categories, counterparties } = storeToRefs(referenceDataStore);

const bankAccounts = computed(() => storeBankAccounts.value);

// Page-size and sort are owned here (UI controls); the cursor state machine
// itself lives in `useCursorPagination`.
const limit = ref(20);
const orderBy = ref<{ field: string; direction: 'asc' | 'desc' }>({ field: 'date', direction: 'desc' });

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

const isSearchMode = computed(() => !!filters.value.search);

const computedHiddenFilters = computed(() => {
  const hidden = [...(props.hiddenFilters || [])];
  if (props.fixedCounterpartyId && !hidden.includes('counterparty')) {
    hidden.push('counterparty');
  }
  return hidden;
});

const sortDirection = computed(() => orderBy.value.direction);

const toggleSortDirection = () => {
  const newDirection = sortDirection.value === 'desc' ? 'asc' : 'desc';
  orderBy.value = { field: 'date', direction: newDirection };
  reload();
};

const pageSizeOptions = [10, 20, 30] as const;

const handlePageSizeChange = (value: unknown) => {
  limit.value = Number(String(value));
  reload();
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

const loadAuxiliaryData = async () => {
  if (!currentUser.value) return;
  await referenceDataStore.load({ userId: currentUser.value.id });
};

// Pure fetcher closing over the active filters; the cursor bookkeeping and the
// loading flag are owned by `useCursorPagination`.
const fetchPage = async (args: {
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  page: number;
}): Promise<ICursorPaginationResult<ITransaction> | null> => {
  if (!currentUser.value) return null;

  const response = await paginateTransactions({
    userId: currentUser.value.id,
    search: filters.value.search || undefined,
    startDate: filters.value.startDate || undefined,
    endDate: filters.value.endDate || undefined,
    type: filters.value.type || undefined,
    categoryIds: filters.value.categoryIds.length > 0 ? filters.value.categoryIds : undefined,
    bankAccountId: currentBankAccount.value?.id || undefined,
    counterpartyId: props.fixedCounterpartyId || filters.value.counterpartyId || undefined,
    pagination: { page: args.page, limit: limit.value, orderBy: orderBy.value },
    cursor: args.cursor,
  });
  return response.data ?? null;
};

const {
  list: transactionsList,
  pageIndex,
  hasPrev,
  hasNext,
  count,
  isLoading: isLoadingData,
  initialized,
  reload,
  goNext,
  goPrev,
} = useCursorPagination<ITransaction>({ fetchPage, isSearchMode });

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
          reload();
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
          reload();
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
  reload();
};

const handleUpdateSuccess = () => {
  updatingTransaction.value = null;
  isUpdateSheetOpen.value = false;
  reload();
};

const handleApplyFilters = () => {
  reload();
};

const handleClearFilters = () => {
  reload();
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
  () => currentBankAccount.value?.id,
  () => {
    reload();
  }
);

watchDebounced(
  () => filters.value.search,
  () => {
    reload();
  },
  { debounce: 400 }
);

onMounted(() => {
  loadAuxiliaryData();
  reload();
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
          :model-value="String(limit)"
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

    <div v-if="isLoadingData && !initialized" class="flex items-center justify-center py-12">
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

      <div v-if="transactionsList.length > 0" class="mt-6">
        <TableCursorPagination
          :has-prev="hasPrev"
          :has-next="hasNext"
          :count="count"
          :page-index="pageIndex"
          :limit="limit"
          :is-loading="isLoadingData"
          :on-prev="goPrev"
          :on-next="goNext"
        />
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
      :on-success="() => { isImportSheetOpen = false; reload(); }"
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
