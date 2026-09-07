<script setup lang="ts">
import { BarChart3Icon, ArrowUpIcon, ArrowDownIcon, PercentIcon } from "lucide-vue-next";
import type { Component } from "vue";
import type { IReport } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import InsightCard from "~/components/Dashboard/InsightCard.vue";
import { calculateCategoryWindowSummary } from "~/services/analytics/calculate-category-window-summary";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  report: IReport;
  categories: ICategory[];
  counterparties: ICounterparty[];
  categoryId: string;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

type ICardModel = {
  title: string;
  value: string;
  subtitle?: string;
  info?: string;
  icon?: Component;
  variant?: "expense" | "deposit";
};

// "2025-12" → "12/2025"
const formatMonthKey = (key: string) => {
  const [year, month] = key.split("-");
  return `${month}/${year}`;
};

const summary = computed(() =>
  calculateCategoryWindowSummary({
    report: props.report,
    categories: props.categories,
    counterparties: props.counterparties,
    categoryId: props.categoryId,
  }),
);

const cards = computed<ICardModel[]>(() => {
  const s = summary.value;
  const cards: ICardModel[] = [];

  if (s.expenseAverage > 0) {
    cards.push({
      title: "Saída média/mês",
      value: formatCurrency({ amount: s.expenseAverage }),
      subtitle: `mediana ${formatCurrency({ amount: s.expenseMedian })}`,
      info: "Média e mediana do que saiu nesta categoria, considerando só os meses com movimento dentro dos últimos 12 meses.",
      icon: BarChart3Icon,
      variant: "expense",
    });
  }

  if (s.depositAverage > 0) {
    cards.push({
      title: "Entrada média/mês",
      value: formatCurrency({ amount: s.depositAverage }),
      subtitle: `mediana ${formatCurrency({ amount: s.depositMedian })}`,
      info: "Média e mediana do que entrou nesta categoria, considerando só os meses com movimento dentro dos últimos 12 meses.",
      icon: BarChart3Icon,
      variant: "deposit",
    });
  }

  if (s.peakMonth) {
    cards.push({
      title: "Mês de pico",
      value: formatCurrency({ amount: s.peakMonth.value }),
      subtitle: formatMonthKey(s.peakMonth.key),
      info: "Mês com o maior valor da categoria dentro da janela de 12 meses.",
      icon: ArrowUpIcon,
    });
  }

  if (s.troughMonth) {
    cards.push({
      title: "Menor mês",
      value: formatCurrency({ amount: s.troughMonth.value }),
      subtitle: formatMonthKey(s.troughMonth.key),
      info: "Mês com o menor valor (entre os meses com movimento) dentro da janela de 12 meses.",
      icon: ArrowDownIcon,
    });
  }

  if (s.trend) {
    const sign = s.trend.percent > 0 ? "+" : "";
    cards.push({
      title: "Tendência",
      value:
        s.trend.direction === "flat"
          ? "Estável"
          : `${sign}${s.trend.percent.toFixed(0)}%`,
      subtitle: "últimos 3 meses vs. 3 anteriores",
      info: "Compara a soma dos 3 meses mais recentes da janela com a dos 3 meses anteriores.",
      icon: s.trend.direction === "down" ? ArrowDownIcon : ArrowUpIcon,
    });
  }

  const share = s.primaryFlow === "deposit" ? s.shareOfDeposits : s.shareOfExpenses;
  if (share > 0) {
    cards.push({
      title: "Participação no total",
      value: `${share.toFixed(1)}%`,
      subtitle:
        s.primaryFlow === "deposit"
          ? "do total de entradas (12m)"
          : "do total de saídas (12m)",
      info: "Quanto esta categoria representa do total movimentado pela conta nos últimos 12 meses.",
      icon: PercentIcon,
    });
  }

  return cards;
});

const topIdentifiers = computed(() => summary.value.topIdentifiers);
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-lg font-semibold">Resumo de 12 meses</h3>
      <p class="text-sm text-muted-foreground">
        Comportamento típico desta categoria nos últimos 12 meses
      </p>
    </div>

    <div
      v-if="cards.length > 0"
      class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      <InsightCard
        v-for="(card, index) in cards"
        :key="index"
        v-bind="card"
        :loading="loading"
      />
    </div>
    <p v-else class="text-sm text-muted-foreground">
      Sem movimentação suficiente nos últimos 12 meses para resumir.
    </p>

    <div v-if="topIdentifiers.length > 0" class="space-y-2">
      <p class="text-xs font-medium text-muted-foreground">
        Principais identificadores (12m)
      </p>
      <div class="space-y-1">
        <div
          v-for="item in topIdentifiers"
          :key="item.id"
          class="flex items-center justify-between text-sm"
        >
          <span class="truncate">{{ item.name }}</span>
          <span class="font-mono font-medium shrink-0 ml-2">
            {{ formatCurrency({ amount: item.amount }) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
