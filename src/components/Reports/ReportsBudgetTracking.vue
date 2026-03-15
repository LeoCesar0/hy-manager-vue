<script setup lang="ts">
import { SettingsIcon } from "lucide-vue-next";
import BudgetProgressBar from "~/components/Charts/BudgetProgressBar.vue";
import type { IBudgetProgress } from "~/services/analytics/calculate-budget-progress";

type IProps = {
  budgetProgress: IBudgetProgress | null;
  loading?: boolean;
  onOpenSettings: () => void;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const hasBudget = computed(() => {
  if (!props.budgetProgress) return false;
  return (
    props.budgetProgress.overallExpense !== null ||
    props.budgetProgress.overallIncome !== null ||
    props.budgetProgress.categoryItems.length > 0
  );
});
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
      <BudgetProgressBar
        v-if="budgetProgress?.overallExpense"
        :label="budgetProgress.overallExpense.label"
        :current="budgetProgress.overallExpense.current"
        :target="budgetProgress.overallExpense.target"
        variant="expense"
      />

      <BudgetProgressBar
        v-if="budgetProgress?.overallIncome"
        :label="budgetProgress.overallIncome.label"
        :current="budgetProgress.overallIncome.current"
        :target="budgetProgress.overallIncome.target"
        variant="deposit"
      />

      <div v-if="budgetProgress && budgetProgress.categoryItems.length > 0">
        <h4 class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Por Categoria
        </h4>
        <div class="space-y-4">
          <BudgetProgressBar
            v-for="item in budgetProgress.categoryItems"
            :key="item.label"
            :label="item.label"
            :current="item.current"
            :target="item.target"
            :variant="item.variant"
          />
        </div>
      </div>
    </div>
  </UiCard>
</template>
