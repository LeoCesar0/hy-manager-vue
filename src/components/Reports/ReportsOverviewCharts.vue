<script setup lang="ts">
import BarChart from "~/components/Charts/BarChart.vue";
import LineChart from "~/components/Charts/LineChart.vue";
import { formatCurrency } from "~/helpers/formatCurrency";
import type { ISavingsRatePoint } from "~/services/analytics/calculate-savings-rate-trend";
import type { ICumulativeBalancePoint } from "~/services/analytics/calculate-cumulative-balance-trend";

type ChartDataItem = {
  label: string;
  income: number;
  expenses: number;
};

type BalanceTrendItem = {
  label: string;
  balance: number;
  ratio: number;
};

type IProps = {
  chartData: ChartDataItem[];
  balanceTrendData: BalanceTrendItem[];
  savingsRateTrend: ISavingsRatePoint[];
  cumulativeBalanceTrend: ICumulativeBalancePoint[];
  loading?: boolean;
};

withDefaults(defineProps<IProps>(), {
  loading: false,
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
      :loading="loading"
      empty-message="Sem dados no período selecionado"
    />

    <div class="grid gap-4 md:grid-cols-2">
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
