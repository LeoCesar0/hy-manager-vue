<script setup lang="ts">
import { TagIcon, UsersIcon, BarChart3Icon, PercentIcon, TrendingDownIcon } from "lucide-vue-next";
import InsightCard from "./InsightCard.vue";
import type { IInsights } from "~/services/analytics/calculate-insights";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  insights: IInsights;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const formatAmount = (amount: number) => formatCurrency({ amount });

const cards = computed(() => [
  {
    title: "Maior saída (categoria)",
    value: props.insights.topExpenseCategory?.name ?? "—",
    subtitle: props.insights.topExpenseCategory
      ? formatAmount(props.insights.topExpenseCategory.amount)
      : undefined,
    comparison: props.insights.topExpenseCategoryAllTime
      ? {
          label: "Histórico",
          value: `${props.insights.topExpenseCategoryAllTime.name} (${formatAmount(props.insights.topExpenseCategoryAllTime.amount)})`,
        }
      : undefined,
    icon: TagIcon,
    variant: "expense" as const,
  },
  {
    title: "Maior entrada (categoria)",
    value: props.insights.topDepositCategory?.name ?? "—",
    subtitle: props.insights.topDepositCategory
      ? formatAmount(props.insights.topDepositCategory.amount)
      : undefined,
    comparison: props.insights.topDepositCategoryAllTime
      ? {
          label: "Histórico",
          value: `${props.insights.topDepositCategoryAllTime.name} (${formatAmount(props.insights.topDepositCategoryAllTime.amount)})`,
        }
      : undefined,
    icon: TagIcon,
    variant: "deposit" as const,
  },
  {
    title: "Maior saída (identificador)",
    value: props.insights.topExpenseCounterparty?.name ?? "—",
    subtitle: props.insights.topExpenseCounterparty
      ? formatAmount(props.insights.topExpenseCounterparty.amount)
      : undefined,
    comparison: props.insights.topExpenseCounterpartyAllTime
      ? {
          label: "Histórico",
          value: `${props.insights.topExpenseCounterpartyAllTime.name} (${formatAmount(props.insights.topExpenseCounterpartyAllTime.amount)})`,
        }
      : undefined,
    icon: UsersIcon,
    variant: "expense" as const,
  },
  {
    title: "Maior entrada (identificador)",
    value: props.insights.topDepositCounterparty?.name ?? "—",
    subtitle: props.insights.topDepositCounterparty
      ? formatAmount(props.insights.topDepositCounterparty.amount)
      : undefined,
    comparison: props.insights.topDepositCounterpartyAllTime
      ? {
          label: "Histórico",
          value: `${props.insights.topDepositCounterpartyAllTime.name} (${formatAmount(props.insights.topDepositCounterpartyAllTime.amount)})`,
        }
      : undefined,
    icon: UsersIcon,
    variant: "deposit" as const,
  },
  {
    title: "Gasto médio mensal",
    value: formatAmount(props.insights.averageMonthlySpending),
    icon: BarChart3Icon,
    variant: "expense" as const,
  },
  {
    title: "Proporção saídas/entradas",
    value: props.insights.expenseToIncomeRatio > 0
      ? `${(props.insights.expenseToIncomeRatio * 100).toFixed(0)}%`
      : "—",
    trend: props.insights.expenseToIncomeRatio > 1
      ? ("down" as const)
      : props.insights.expenseToIncomeRatio > 0
        ? ("up" as const)
        : undefined,
    subtitle: props.insights.expenseToIncomeRatio > 1
      ? "Gastando mais do que recebe"
      : props.insights.expenseToIncomeRatio > 0
        ? "Dentro do orçamento"
        : undefined,
    icon: PercentIcon,
  },
  {
    title: "Variação mensal de gastos",
    value: props.insights.monthOverMonthChange !== null
      ? `${props.insights.monthOverMonthChange > 0 ? "+" : ""}${props.insights.monthOverMonthChange.toFixed(1)}%`
      : "—",
    trend: props.insights.monthOverMonthChange !== null
      ? props.insights.monthOverMonthChange > 0
        ? ("down" as const)
        : ("up" as const)
      : undefined,
    subtitle: props.insights.monthOverMonthChange !== null
      ? "vs. mês anterior"
      : "Dados insuficientes",
    icon: TrendingDownIcon,
    variant: "expense" as const,
  },
]);
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
        :comparison="card.comparison"
        :icon="card.icon"
        :trend="card.trend"
        :variant="card.variant"
        :loading="loading"
      />
    </div>
  </div>
</template>
