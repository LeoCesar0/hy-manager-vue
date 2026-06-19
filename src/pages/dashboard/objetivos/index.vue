<script setup lang="ts">
import { h } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { WalletIcon, TargetIcon } from "lucide-vue-next";
import type { IBudget, ICategoryBudget } from "~/@schemas/models/budget";
import { listBudgets } from "~/services/api/budgets/list-budgets";
import { getOrCreateBudget } from "~/services/api/budgets/get-or-create-budget";
import { updateBudget } from "~/services/api/budgets/update-budget";
import { deleteBudget } from "~/services/api/budgets/delete-budget";
import {
  buildObjetivoRows,
  type IObjetivoRow,
} from "~/helpers/budget/buildObjetivoRows";
import { formatCurrency } from "~/helpers/formatCurrency";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import EmptyState from "~/components/Dashboard/EmptyState.vue";
import ActionButtons from "~/components/Dashboard/ActionButtons.vue";
import BudgetSettingsDialog from "~/components/Reports/BudgetSettingsDialog.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const dashboardStore = useDashboardStore();
const { bankAccounts, isLoadingBankAccounts } = storeToRefs(dashboardStore);

const referenceDataStore = useReferenceDataStore();
const { categories } = storeToRefs(referenceDataStore);

const budgets = ref<IBudget[]>([]);
const isLoadingBudgets = ref(false);

const isLoading = computed(
  () => isLoadingBankAccounts.value || isLoadingBudgets.value,
);

const rows = computed<IObjetivoRow[]>(() =>
  buildObjetivoRows({
    bankAccounts: bankAccounts.value,
    budgets: budgets.value,
  }),
);

// One row per bank account — small, fully in-memory. A single page sized to fit
// all rows keeps the shared Table component happy without paginated fetching.
const paginationBody = ref<IPaginationBody>({ page: 1, limit: 1000 });

const paginationResult = computed<IPaginationResult<IObjetivoRow>>(() => ({
  count: rows.value.length,
  pages: 1,
  currentPage: 1,
  list: rows.value,
}));

const loadBudgets = async () => {
  if (!currentUser.value) return;
  isLoadingBudgets.value = true;
  try {
    const response = await listBudgets({
      userId: currentUser.value.id,
      options: { toastOptions: undefined },
    });
    if (response.data) budgets.value = response.data;
  } finally {
    isLoadingBudgets.value = false;
  }
};

// --- Edit dialog ---------------------------------------------------------
const dialogOpen = ref(false);
const editingRow = ref<IObjetivoRow | null>(null);
const editingBudget = ref<IBudget | null>(null);

const handleConfigure = async (row: IObjetivoRow) => {
  editingRow.value = row;
  // Reuse the existing per-account get-or-create so the dialog always receives
  // a real budget doc (id === bankAccountId); for accounts without one this
  // lazily creates the bare doc, matching the reports flow.
  const response = await getOrCreateBudget({
    userId: currentUser.value!.id,
    bankAccountId: row.bankAccountId,
    options: { toastOptions: undefined },
  });
  if (!response.data) return;
  editingBudget.value = response.data;
  dialogOpen.value = true;
};

const handleCloseDialog = () => {
  dialogOpen.value = false;
  editingRow.value = null;
  editingBudget.value = null;
};

const handleSave = async (data: {
  monthlyExpenseLimit: number | null;
  monthlyIncomeGoal: number | null;
  categoryBudgets: ICategoryBudget[];
}) => {
  const row = editingRow.value;
  if (!row) return;
  const response = await updateBudget({
    bankAccountId: row.bankAccountId,
    data,
  });
  if (response.data) {
    await loadBudgets();
  }
};

// --- Delete --------------------------------------------------------------
const { openDialog } = useAlertDialog();

const handleDelete = (row: IObjetivoRow) => {
  openDialog({
    title: "Deletar Objetivo",
    message: `Tem certeza que deseja deletar o objetivo da conta "${row.bankAccountName}"?`,
    confirm: {
      label: "Deletar",
      action: async () => {
        const response = await deleteBudget({
          bankAccountId: row.bankAccountId,
          options: {
            toastOptions: {
              loading: { message: "Deletando objetivo..." },
              success: { message: "Objetivo deletado com sucesso!" },
              error: true,
            },
          },
        });
        if (response.data) await loadBudgets();
      },
    },
  });
};

const renderAmount = (value: number | null) =>
  value === null
    ? h("span", { class: "text-sm text-muted-foreground" }, "—")
    : h("span", { class: "text-sm font-medium" }, formatCurrency({ amount: value }));

const columns: ColumnDef<IObjetivoRow>[] = [
  {
    accessorKey: "bankAccountName",
    header: "Conta Bancária",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(WalletIcon, { class: "h-4 w-4 text-muted-foreground" }),
        h("span", { class: "font-medium" }, row.original.bankAccountName),
      ]),
  },
  {
    id: "monthlyExpenseLimit",
    header: "Limite de gastos mensal",
    cell: ({ row }) => renderAmount(row.original.monthlyExpenseLimit),
  },
  {
    id: "monthlyIncomeGoal",
    header: "Meta de receita mensal",
    cell: ({ row }) => renderAmount(row.original.monthlyIncomeGoal),
  },
  {
    id: "categoryBudgetsCount",
    header: "Categorias configuradas",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm text-muted-foreground" },
        String(row.original.categoryBudgetsCount),
      ),
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const objetivoRow = row.original;
      if (!objetivoRow.isConfigured) {
        return h(
          "button",
          {
            class:
              "inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline",
            onClick: () => handleConfigure(objetivoRow),
          },
          [h(TargetIcon, { class: "h-4 w-4" }), "Criar objetivo"],
        );
      }
      return h(ActionButtons, {
        editVariant: "ghost",
        deleteVariant: "ghost",
        onEdit: () => handleConfigure(objetivoRow),
        onDelete: () => handleDelete(objetivoRow),
      });
    },
  },
];

onMounted(() => {
  if (currentUser.value) {
    referenceDataStore.load({ userId: currentUser.value.id });
  }
  loadBudgets();
});
</script>

<template>
  <DashboardSection
    title="Objetivos"
    subtitle="Defina limites de gastos e metas de receita por conta bancária"
    :loading="isLoading && rows.length === 0"
  >
    <EmptyState
      v-if="rows.length === 0 && !isLoading"
      title="Nenhuma conta bancária encontrada"
      description="Crie uma conta bancária para começar a definir objetivos."
      :show-create-button="false"
    />

    <Table
      v-else
      :columns="columns"
      :pagination-body="paginationBody"
      :pagination-result="paginationResult"
      :is-loading="isLoading"
    />

    <BudgetSettingsDialog
      :open="dialogOpen"
      :budget="editingBudget"
      :categories="categories"
      :on-close="handleCloseDialog"
      :on-save="handleSave"
    />
  </DashboardSection>
</template>
