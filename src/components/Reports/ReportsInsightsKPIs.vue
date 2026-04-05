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

// "2024-03" → "03/2024" — matches the MM/YYYY convention used by
// ReportsOverviewCharts' month labels so users see a consistent format.
const formatMonthKey = (key: string) => {
  const [year, month] = key.split("-");
  return `${month}/${year}`;
};

const cards = computed(() => {
  const insights = props.insights;
  if (!insights) return [];

  // Comparison cards (biggest increase/decrease) are first-vs-last-month based
  // and return null on a single-month selection, so we filter them out instead
  // of rendering a "—" placeholder that adds no information.
  const all = [
    {
      title: "Taxa de poupança",
      value:
        insights.savingsRate !== null
          ? `${insights.savingsRate.toFixed(1)}%`
          : "—",
      subtitle:
        insights.savingsRate !== null
          ? insights.savingsRate >= 0
            ? "do período selecionado"
            : "Gastando mais do que recebe"
          : "Sem entradas no período",
      trend:
        insights.savingsRate !== null
          ? insights.savingsRate >= 20
            ? ("up" as const)
            : insights.savingsRate >= 0
              ? ("neutral" as const)
              : ("down" as const)
          : undefined,
      icon: PiggyBankIcon,
      visible: true,
    },
    {
      title: "Maior aumento de gastos",
      value: insights.biggestIncrease?.name ?? "—",
      subtitle: insights.biggestIncrease
        ? `+${formatCurrency({ amount: insights.biggestIncrease.change })} em ${formatMonthKey(insights.biggestIncrease.monthKey)}`
        : "Sem variação",
      trend: insights.biggestIncrease ? ("down" as const) : undefined,
      icon: TrendingUpIcon,
      variant: "expense" as const,
      visible: insights.biggestIncrease !== null,
    },
    {
      title: "Maior redução de gastos",
      value: insights.biggestDecrease?.name ?? "—",
      subtitle: insights.biggestDecrease
        ? `${formatCurrency({ amount: insights.biggestDecrease.change })} em ${formatMonthKey(insights.biggestDecrease.monthKey)}`
        : "Sem variação",
      trend: insights.biggestDecrease ? ("up" as const) : undefined,
      icon: TrendingDownIcon,
      variant: "deposit" as const,
      visible: insights.biggestDecrease !== null,
    },
    {
      title: "Entradas (ano)",
      value: formatCurrency({ amount: insights.ytdIncome }),
      icon: CalendarIcon,
      variant: "deposit" as const,
      visible: true,
    },
    {
      title: "Saídas (ano)",
      value: formatCurrency({ amount: insights.ytdExpenses }),
      icon: CalendarIcon,
      variant: "expense" as const,
      visible: true,
    },
    {
      title: "Saldo (ano)",
      value: formatCurrency({ amount: insights.ytdBalance }),
      trend: insights.ytdBalance >= 0 ? ("up" as const) : ("down" as const),
      icon: CalendarIcon,
      visible: true,
    },
    {
      title: "Ganho médio mensal",
      value: formatCurrency({ amount: insights.averageMonthlyIncome }),
      subtitle: "baseado em todo o histórico",
      icon: BarChart3Icon,
      variant: "deposit" as const,
      visible: true,
    },
    {
      title: "Gasto médio mensal",
      value: formatCurrency({ amount: insights.averageMonthlySpending }),
      subtitle: "baseado em todo o histórico",
      icon: BarChart3Icon,
      variant: "expense" as const,
      visible: true,
    },
  ];

  return all.filter((c) => c.visible);
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
