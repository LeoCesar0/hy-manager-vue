<script setup lang="ts">
import { SettingsIcon } from "lucide-vue-next";
import BudgetProgressBar from "~/components/Charts/BudgetProgressBar.vue";
import type { IMonthBudgetProgress } from "~/composables/useReportsAnalytics";

type IProps = {
  budgetProgressPerMonth: IMonthBudgetProgress[];
  loading?: boolean;
  onOpenSettings: () => void;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const hasBudget = computed(() => {
  return props.budgetProgressPerMonth.some(
    ({ progress }) =>
      progress.overallExpense !== null ||
      progress.overallIncome !== null ||
      progress.categoryItems.length > 0,
  );
});

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  return `${monthNames[parseInt(month!) - 1]} ${year}`;
};
</script>

<template>
  <UiCard class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-muted-foreground">Orçamento</h3>
      <UiButton size="sm" variant="outline" @click="onOpenSettings">
        <SettingsIcon class="h-4 w-4 mr-1" />
        Configurar
      </UiButton>
    </div>

    <div v-if="!hasBudget" class="flex flex-col items-center justify-center py-8 gap-3">
      <p class="text-sm text-muted-foreground text-center">
        Nenhum orçamento configurado. Defina limites de gastos e metas de receita.
      </p>
      <UiButton size="sm" variant="outline" @click="onOpenSettings">
        Configurar Orçamento
      </UiButton>
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="{ monthKey, progress } in budgetProgressPerMonth"
        :key="monthKey"
        class="space-y-4"
      >
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider border-b pb-2">
          {{ formatMonthLabel(monthKey) }}
        </h4>

        <BudgetProgressBar
          v-if="progress.overallExpense"
          :label="progress.overallExpense.label"
          :current="progress.overallExpense.current"
          :target="progress.overallExpense.target"
          variant="expense"
        />

        <BudgetProgressBar
          v-if="progress.overallIncome"
          :label="progress.overallIncome.label"
          :current="progress.overallIncome.current"
          :target="progress.overallIncome.target"
          variant="deposit"
        />

        <div v-if="progress.categoryItems.length > 0">
          <h4 class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Por Categoria
          </h4>
          <div class="space-y-4">
            <BudgetProgressBar
              v-for="item in progress.categoryItems"
              :key="item.label"
              :label="item.label"
              :current="item.current"
              :target="item.target"
              :variant="item.variant"
              :is-positive-expense="item.isPositiveExpense"
            />
          </div>
        </div>
      </div>
    </div>
  </UiCard>
</template>
