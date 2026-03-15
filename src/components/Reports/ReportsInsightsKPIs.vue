<script setup lang="ts">
import {
  PiggyBankIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  BarChart3Icon,
} from "lucide-vue-next";
import InsightCard from "~/components/Dashboard/InsightCard.vue";
import type { IReportInsights } from "~/services/analytics/calculate-report-insights";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  insights: IReportInsights | null;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const cards = computed(() => {
  if (!props.insights) return [];

  return [
    {
      title: "Taxa de poupança",
      value:
        props.insights.savingsRate !== null
          ? `${props.insights.savingsRate.toFixed(1)}%`
          : "—",
      subtitle:
        props.insights.savingsRate !== null
          ? props.insights.savingsRate >= 0
            ? "do período selecionado"
            : "Gastando mais do que recebe"
          : "Sem entradas no período",
      trend:
        props.insights.savingsRate !== null
          ? props.insights.savingsRate >= 20
            ? ("up" as const)
            : props.insights.savingsRate >= 0
              ? ("neutral" as const)
              : ("down" as const)
          : undefined,
      icon: PiggyBankIcon,
    },
    {
      title: "Maior aumento de gastos",
      value: props.insights.biggestIncrease?.name ?? "—",
      subtitle: props.insights.biggestIncrease
        ? `+${formatCurrency({ amount: props.insights.biggestIncrease.change })} (${props.insights.biggestIncrease.changePercent.toFixed(0)}%)`
        : "Sem variação",
      trend: props.insights.biggestIncrease ? ("down" as const) : undefined,
      icon: TrendingUpIcon,
      variant: "expense" as const,
    },
    {
      title: "Maior redução de gastos",
      value: props.insights.biggestDecrease?.name ?? "—",
      subtitle: props.insights.biggestDecrease
        ? `${formatCurrency({ amount: props.insights.biggestDecrease.change })} (${props.insights.biggestDecrease.changePercent.toFixed(0)}%)`
        : "Sem variação",
      trend: props.insights.biggestDecrease ? ("up" as const) : undefined,
      icon: TrendingDownIcon,
      variant: "deposit" as const,
    },
    {
      title: "Entradas (ano)",
      value: formatCurrency({ amount: props.insights.ytdIncome }),
      icon: CalendarIcon,
      variant: "deposit" as const,
    },
    {
      title: "Saídas (ano)",
      value: formatCurrency({ amount: props.insights.ytdExpenses }),
      icon: CalendarIcon,
      variant: "expense" as const,
    },
    {
      title: "Saldo (ano)",
      value: formatCurrency({ amount: props.insights.ytdBalance }),
      trend: props.insights.ytdBalance >= 0 ? ("up" as const) : ("down" as const),
      icon: CalendarIcon,
    },
    {
      title: "Gasto médio mensal",
      value: formatCurrency({ amount: props.insights.averageMonthlySpending }),
      subtitle: "baseado em todo o histórico",
      icon: BarChart3Icon,
      variant: "expense" as const,
    },
  ];
});
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold mb-4">Insights</h2>
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <InsightCard
        v-for="(card, index) in cards"
        :key="index"
        :title="card.title"
        :value="card.value"
        :subtitle="card.subtitle"
        :icon="card.icon"
        :trend="card.trend"
        :variant="card.variant"
        :loading="loading"
      />
    </div>
  </div>
</template>
