<script setup lang="ts">
import { Switch as UiSwitch } from "~/components/ui/switch";
import DonutChart from "~/components/Dashboard/DonutChart.vue";
import type { IPeriodBreakdowns } from "~/services/analytics/aggregate-period-breakdowns";

type IProps = {
  breakdowns: IPeriodBreakdowns;
  monthCount: number;
  includePositiveExpenses: boolean;
  onToggleIncludePositiveExpenses: (value: boolean) => void;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

// Subtitle adapts to how much data the donuts cover, so users understand the
// scope is "the whole selected period" rather than "last month" like the
// Dashboard donuts suggest.
const subtitle = computed(() => {
  if (props.monthCount === 0) return "Selecione meses para ver a distribuição";
  if (props.monthCount === 1) return "Agregado de 1 mês selecionado";
  return `Agregado de ${props.monthCount} meses selecionados`;
});

const handleToggle = (value: boolean) => {
  props.onToggleIncludePositiveExpenses(value);
};
</script>

<template>
  <UiCard class="p-6">
    <div class="mb-4 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h3 class="text-sm font-medium text-muted-foreground">Distribuição do Período</h3>
        <p class="text-xs text-muted-foreground/70 mt-0.5">{{ subtitle }}</p>
      </div>

      <!-- Toggle scope is expense donuts only — deposit donuts are never
           filtered because positive-expense is an expense-side concept. -->
      <UiTooltip>
        <UiTooltipTrigger as-child>
          <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <UiSwitch
              :model-value="includePositiveExpenses"
              @update:model-value="handleToggle"
            />
            <span>incluir investimentos</span>
          </label>
        </UiTooltipTrigger>
        <UiTooltipContent class="max-w-xs">
          <p class="text-xs">
            Inclui categorias de investimento nos donuts de despesas.
            Quando desligado, elas são omitidas dos totais.
          </p>
        </UiTooltipContent>
      </UiTooltip>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <DonutChart
        title="Saídas por Categoria"
        :data="breakdowns.expensesByCategory"
        :loading="loading"
        empty-message="Nenhuma despesa no período"
        variant="expense"
      />
      <DonutChart
        title="Saídas por Identificador"
        :data="breakdowns.expensesByCounterparty"
        :loading="loading"
        empty-message="Nenhuma despesa com identificador no período"
        variant="expense"
      />
      <DonutChart
        title="Entradas por Categoria"
        :data="breakdowns.depositsByCategory"
        :loading="loading"
        empty-message="Nenhuma receita no período"
        variant="deposit"
      />
      <DonutChart
        title="Entradas por Identificador"
        :data="breakdowns.depositsByCounterparty"
        :loading="loading"
        empty-message="Nenhuma receita com identificador no período"
        variant="deposit"
      />
    </div>
  </UiCard>
</template>
