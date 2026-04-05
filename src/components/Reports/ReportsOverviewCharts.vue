<script setup lang="ts">
import BarChart from "~/components/Charts/BarChart.vue";
import LineChart from "~/components/Charts/LineChart.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import type { ISavingsRatePoint } from "~/services/analytics/calculate-savings-rate-trend";
import type { ICumulativeBalancePoint } from "~/services/analytics/calculate-cumulative-balance-trend";
import type { IBalanceTrendPoint } from "~/services/analytics/calculate-balance-trend";

type ChartDataItem = {
  label: string;
  income: number;
  expenses: number;
};

type IProps = {
  chartData: ChartDataItem[];
  balanceTrendData: IBalanceTrendPoint[];
  savingsRateTrend: ISavingsRatePoint[];
  cumulativeBalanceTrend: ICumulativeBalancePoint[];
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
      :loading="loading"
      empty-message="Sem dados no período selecionado"
    />

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
