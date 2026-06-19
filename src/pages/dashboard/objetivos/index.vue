<script setup lang="ts">
import { TargetIcon } from "lucide-vue-next";
import type { IBudget } from "~/@schemas/models/budget";
import { getOrCreateBudget } from "~/services/api/budgets/get-or-create-budget";
import { updateBudget } from "~/services/api/budgets/update-budget";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import EmptyState from "~/components/Dashboard/EmptyState.vue";
import BudgetSettingsForm from "~/components/Reports/BudgetSettingsForm.vue";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const dashboardStore = useDashboardStore();
const { currentBankAccount } = storeToRefs(dashboardStore);

const referenceDataStore = useReferenceDataStore();
const { categories } = storeToRefs(referenceDataStore);

const budget = ref<IBudget | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const formRef = ref<InstanceType<typeof BudgetSettingsForm> | null>(null);

// Bumped on every (re)load and after save/clear so the keyed form remounts and
// re-hydrates from the freshly persisted budget.
const formVersion = ref(0);
const formKey = computed(
  () => `${currentBankAccount.value?.id ?? "none"}:${formVersion.value}`,
);

const isConfigured = computed(
  () =>
    !!budget.value &&
    (budget.value.monthlyExpenseLimit !== null ||
      budget.value.monthlyIncomeGoal !== null ||
      budget.value.categoryBudgets.length > 0),
);

const loadBudget = async () => {
  if (!currentUser.value || !currentBankAccount.value) {
    budget.value = null;
    return;
  }
  isLoading.value = true;
  try {
    const response = await getOrCreateBudget({
      userId: currentUser.value.id,
      bankAccountId: currentBankAccount.value.id,
      options: { toastOptions: undefined },
    });
    budget.value = response.data ?? null;
    formVersion.value++;
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value || !currentBankAccount.value) return;
  isSaving.value = true;
  try {
    const response = await updateBudget({
      bankAccountId: currentBankAccount.value.id,
      data: formRef.value.getPayload(),
    });
    if (response.data) {
      budget.value = response.data;
      formVersion.value++;
    }
  } finally {
    isSaving.value = false;
  }
};

const { openDialog } = useAlertDialog();

const handleClear = () => {
  if (!currentBankAccount.value) return;
  openDialog({
    title: "Limpar objetivo",
    message: `Isto remove o limite de gastos, a meta de receita e os objetivos por categoria de "${currentBankAccount.value.name}". Deseja continuar?`,
    confirm: {
      label: "Limpar",
      action: async () => {
        const response = await updateBudget({
          bankAccountId: currentBankAccount.value!.id,
          data: {
            monthlyExpenseLimit: null,
            monthlyIncomeGoal: null,
            categoryBudgets: [],
          },
          options: {
            toastOptions: {
              loading: { message: "Limpando objetivo..." },
              success: { message: "Objetivo limpo." },
              error: true,
            },
          },
        });
        if (response.data) {
          budget.value = response.data;
          formVersion.value++;
        }
      },
    },
  });
};

watch(
  () => currentBankAccount.value?.id,
  () => {
    loadBudget();
  },
);

onMounted(() => {
  if (currentUser.value) {
    referenceDataStore.load({ userId: currentUser.value.id });
  }
  loadBudget();
});
</script>

<template>
  <DashboardSection
    title="Objetivos"
    :subtitle="
      currentBankAccount
        ? `Limites e metas de ${currentBankAccount.name} para o mês atual`
        : 'Defina limites de gastos e metas de receita por conta'
    "
    :loading="isLoading && !budget"
  >
    <EmptyState
      v-if="!currentBankAccount"
      title="Nenhuma conta selecionada"
      description="Selecione uma conta bancária no topo para definir seus objetivos."
      :show-create-button="false"
    />

    <div v-else class="mx-auto w-full max-w-3xl space-y-6">
      <UiCard class="p-6">
        <BudgetSettingsForm
          :key="formKey"
          ref="formRef"
          :budget="budget"
          :categories="categories"
        />
      </UiCard>

      <div class="flex items-center justify-between gap-3">
        <UiButton
          v-if="isConfigured"
          variant="ghost"
          class="text-destructive hover:text-destructive"
          @click="handleClear"
        >
          Limpar objetivo
        </UiButton>
        <span v-else aria-hidden="true" />

        <UiButton :disabled="isSaving || !budget" @click="handleSave">
          <TargetIcon class="h-4 w-4 mr-1" />
          Salvar objetivo
        </UiButton>
      </div>
    </div>
  </DashboardSection>
</template>
