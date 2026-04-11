<script setup lang="ts">
import { Switch as UiSwitch } from "~/components/ui/switch";
import BarChart from "~/components/Charts/BarChart.vue";
import LineChart from "~/components/Charts/LineChart.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import type { ISavingsRatePoint } from "~/services/analytics/calculate-savings-rate-trend";
import type { ICumulativeBalancePoint } from "~/services/analytics/calculate-cumulative-balance-trend";
import type { IBalanceTrendPoint } from "~/services/analytics/calculate-balance-trend";
import type { IOverviewBarPoint } from "~/services/analytics/calculate-overview-bars";

type IProps = {
  chartData: IOverviewBarPoint[];
  balanceTrendData: IBalanceTrendPoint[];
  savingsRateTrend: ISavingsRatePoint[];
  cumulativeBalanceTrend: ICumulativeBalancePoint[];
  includePositiveExpensesInBars: boolean;
  onToggleIncludePositiveExpensesInBars: (value: boolean) => void;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

// Trend lines need at least two data points to be meaningful. On a single-month
// selection they collapse to one dot, and "Saldo Acumulado" over one month is
// just that month's balance — pure noise. Hide the whole trend grid and leave
// the bar chart as the overview for single-month mode.
const hasTrendData = computed(() => props.balanceTrendData.length >= 2);

// Bar chart series — 3 bars per month: Entradas (green), Saídas reais (red),
// and Investimentos (muted). The Investimentos segment exists only when a
// month has activity in positive-expense categories; unovis still renders
// zero-height bars gracefully.
// Rendering positiveExpenses as a separate bar rather than a stacked segment
// because @unovis/vue's GroupedBar doesn't natively compose with StackedBar.
// The 3-grouped visual still surfaces the split clearly, keeps the expense
// colors adjacent, and avoids hacky multi-component overlays.
const hasPositiveExpenses = computed(() =>
  props.chartData.some((d) => d.positiveExpenses > 0),
);

const barSeries = computed(() => {
  const base = [
    {
      key: "income",
      label: "Entradas",
      color: "var(--deposit)",
      accessor: (d: IOverviewBarPoint) => d.income,
    },
    {
      key: "realExpenses",
      label: "Saídas reais",
      color: "var(--expense)",
      accessor: (d: IOverviewBarPoint) => d.realExpenses,
    },
  ];

  // Only include the Investimentos series when any month has positive-expense
  // activity — avoids an empty legend slot for users who don't track saving.
  if (hasPositiveExpenses.value) {
    base.push({
      key: "positiveExpenses",
      label: "Investimentos",
      color: "color-mix(in oklch, var(--expense) 45%, var(--muted))",
      accessor: (d: IOverviewBarPoint) => d.positiveExpenses,
    });
  }

  return base;
});

const balanceSeries = [
  { key: "balance", label: "Saldo", color: "var(--primary)" },
];

const ratioSeries = [
  { key: "ratio", label: "Proporção Saídas/Entradas", color: "var(--expense)" },
];

const savingsRateSeries = [
  { key: "savingsRate", label: "Taxa de Poupança", color: "var(--deposit)" },
];

const cumulativeSeries = [
  { key: "cumulative", label: "Saldo Acumulado", color: "var(--primary)" },
];

const formatRatio = (v: number) => `${(v * 100).toFixed(0)}%`;
const formatSavingsRate = (v: number) => `${(v * 100).toFixed(1)}%`;
const formatCurrencyValue = (v: number) => formatCurrency({ amount: v });
</script>

<template>
  <div class="space-y-4">
    <BarChart
      title="Entradas vs Saídas"
      :data="chartData"
      :series="barSeries"
      :loading="loading"
      empty-message="Sem dados no período selecionado"
    >
      <template #headerActions>
        <UiTooltip>
          <UiTooltipTrigger as-child>
            <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <UiSwitch
                :model-value="includePositiveExpensesInBars"
                @update:model-value="onToggleIncludePositiveExpensesInBars"
              />
              <span>separar</span>
            </label>
          </UiTooltipTrigger>
          <UiTooltipContent class="max-w-xs">
            <p class="text-xs">
              Separa investimentos da barra de gastos em uma barra própria.
              Quando desligado, são somados ao total de saídas.
            </p>
          </UiTooltipContent>
        </UiTooltip>
      </template>
    </BarChart>

    <div v-if="hasTrendData" class="grid gap-4 md:grid-cols-2">
      <LineChart
        title="Tendência de Saldo"
        :data="balanceTrendData"
        :series="balanceSeries"
        :loading="loading"
        empty-message="Sem dados no período"
      />
      <LineChart
        title="Proporção Saídas/Entradas"
        :data="balanceTrendData"
        :series="ratioSeries"
        :loading="loading"
        empty-message="Sem dados no período"
        :format-value="formatRatio"
      />
      <LineChart
        title="Taxa de Poupança"
        :data="savingsRateTrend"
        :series="savingsRateSeries"
        :loading="loading"
        empty-message="Sem dados no período"
        :format-value="formatSavingsRate"
      />
      <LineChart
        title="Saldo Acumulado"
        :data="cumulativeBalanceTrend"
        :series="cumulativeSeries"
        :loading="loading"
        empty-message="Sem dados no período"
        :format-value="formatCurrencyValue"
      />
    </div>
  </div>
</template>
