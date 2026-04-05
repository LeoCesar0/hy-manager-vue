<script setup lang="ts">
import DonutChart from "~/components/Dashboard/DonutChart.vue";
import type { IPeriodBreakdowns } from "~/services/analytics/aggregate-period-breakdowns";

type IProps = {
  breakdowns: IPeriodBreakdowns;
  monthCount: number;
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
</script>

<template>
  <UiCard class="p-6">
    <div class="mb-4">
      <h3 class="text-sm font-medium text-muted-foreground">Distribuição do Período</h3>
      <p class="text-xs text-muted-foreground/70 mt-0.5">{{ subtitle }}</p>
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
        title="Saídas por Terceiro"
        :data="breakdowns.expensesByCounterparty"
        :loading="loading"
        empty-message="Nenhuma despesa com terceiro no período"
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
        title="Entradas por Terceiro"
        :data="breakdowns.depositsByCounterparty"
        :loading="loading"
        empty-message="Nenhuma receita com terceiro no período"
        variant="deposit"
      />
    </div>
  </UiCard>
</template>
