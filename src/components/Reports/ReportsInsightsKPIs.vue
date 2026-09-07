<script setup lang="ts">
import {
  PiggyBankIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  ShoppingCartIcon,
  LayersIcon,
  RepeatIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-vue-next";
import type { Component } from "vue";
import InsightCard from "~/components/Dashboard/InsightCard.vue";
import InsightGroup from "~/components/Reports/InsightGroup.vue";
import CategoryAverageCard from "~/components/Reports/CategoryAverageCard.vue";
import type { IReportInsights } from "~/services/analytics/calculate-report-insights";
import type { ITwelveMonthInsightRow } from "~/services/analytics/calculate-twelve-month-insights";
import type { IKeyCategoryInsight } from "~/services/analytics/calculate-key-category-insights";
import type { ICategoryAnomaly } from "~/services/analytics/calculate-category-anomaly";
import type { ITicketFrequencyItem } from "~/services/analytics/calculate-ticket-frequency";
import type { IConcentrationRecurrence } from "~/services/analytics/calculate-concentration-recurrence";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  insights: IReportInsights | null;
  twelveMonthInsights?: ITwelveMonthInsightRow[];
  keyCategoryInsights?: IKeyCategoryInsight[];
  anomaly?: ICategoryAnomaly | null;
  ticketFrequency?: ITicketFrequencyItem[];
  concentrationRecurrence?: IConcentrationRecurrence | null;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  twelveMonthInsights: () => [],
  keyCategoryInsights: () => [],
  anomaly: null,
  ticketFrequency: () => [],
  concentrationRecurrence: null,
  loading: false,
});

// The section opens condensed; this reveals the secondary blocks (rest of período,
// ano corrente, hábitos, histórico). Always-visible blocks ignore this flag.
const expanded = ref(false);

// Shape of a card built here and rendered by InsightCard. Mirrors InsightCard's
// props so a card object can be v-bound directly.
type ICardModel = {
  title: string;
  value: string;
  subtitle?: string;
  comparison?: { label: string; value: string };
  info?: string;
  icon?: Component;
  trend?: "up" | "down" | "neutral";
  variant?: "expense" | "deposit";
};

// "2024-03" → "03/2024" — matches the MM/YYYY convention used elsewhere.
const formatMonthKey = (key: string) => {
  const [year, month] = key.split("-");
  return `${month}/${year}`;
};

// Appends "+ R$ X em investimentos" to a subtitle when there are positive-expense
// outflows in the period; returns the base unchanged otherwise.
const withPositiveExpenseAddendum = (base: string, positiveAmount: number) => {
  if (positiveAmount <= 0) return base;
  return `${base} + ${formatCurrency({ amount: positiveAmount })} em investimentos`;
};

// --- Always visible: taxa de poupança (período selecionado) ---
const savingsCard = computed<ICardModel | null>(() => {
  const insights = props.insights;
  if (!insights) return null;

  return {
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
    info: "Quanto das suas entradas sobrou após as despesas reais no período selecionado. Investimentos não contam como gasto.",
    trend:
      insights.savingsRate !== null
        ? insights.savingsRate >= 20
          ? "up"
          : insights.savingsRate >= 0
            ? "neutral"
            : "down"
        : undefined,
    icon: PiggyBankIcon,
  };
});

// --- Group (expandable): rest of período selecionado (follows the month selector) ---
const periodExtraCards = computed<ICardModel[]>(() => {
  const insights = props.insights;
  if (!insights) return [];

  const cards: (ICardModel & { visible: boolean })[] = [
    {
      title: "Maior aumento de gastos",
      value: insights.biggestIncrease?.name ?? "—",
      subtitle: insights.biggestIncrease
        ? `+${formatCurrency({ amount: insights.biggestIncrease.change })} em ${formatMonthKey(insights.biggestIncrease.monthKey)}`
        : "Sem variação",
      info: "Categoria com o maior salto de gasto entre dois meses consecutivos do período selecionado.",
      trend: insights.biggestIncrease ? "down" : undefined,
      icon: TrendingUpIcon,
      variant: "expense",
      visible: insights.biggestIncrease !== null,
    },
    {
      title: "Maior redução de gastos",
      value: insights.biggestDecrease?.name ?? "—",
      subtitle: insights.biggestDecrease
        ? `${formatCurrency({ amount: insights.biggestDecrease.change })} em ${formatMonthKey(insights.biggestDecrease.monthKey)}`
        : "Sem variação",
      info: "Categoria com a maior queda de gasto entre dois meses consecutivos do período selecionado.",
      trend: insights.biggestDecrease ? "up" : undefined,
      icon: TrendingDownIcon,
      variant: "deposit",
      visible: insights.biggestDecrease !== null,
    },
    {
      title: "Maior anomalia",
      value: props.anomaly?.name ?? "—",
      subtitle: props.anomaly
        ? `+${props.anomaly.deviationPercent.toFixed(0)}% vs média 12m (${formatCurrency({ amount: props.anomaly.twelveMonthAverage })}/mês)`
        : "",
      info: "Categoria cujo gasto no período mais se distancia, para cima, da sua própria média dos últimos 12 meses.",
      icon: AlertTriangleIcon,
      variant: "expense",
      visible: props.anomaly !== null,
    },
  ];

  // Strip the internal `visible` flag so v-bind doesn't leak it as a DOM attr.
  return cards.filter((c) => c.visible).map(({ visible: _visible, ...card }) => card);
});

// --- Group: ano corrente (YTD, ignores the selector) ---
const yearCards = computed<ICardModel[]>(() => {
  const insights = props.insights;
  if (!insights) return [];

  const incomeComparison =
    insights.prevYtdIncome !== null
      ? {
          label: "Mesmo período ano passado",
          value: formatCurrency({ amount: insights.prevYtdIncome }),
        }
      : undefined;
  const expensesComparison =
    insights.prevYtdExpenses !== null
      ? {
          label: "Mesmo período ano passado",
          value: formatCurrency({ amount: insights.prevYtdExpenses }),
        }
      : undefined;

  return [
    {
      title: "Entradas (ano)",
      value: formatCurrency({ amount: insights.ytdIncome }),
      info: "Total de entradas no ano-calendário corrente (de janeiro até hoje), independente do período selecionado.",
      comparison: incomeComparison,
      icon: CalendarIcon,
      variant: "deposit",
    },
    {
      title: "Saídas (ano)",
      value: formatCurrency({ amount: insights.ytdExpenses }),
      subtitle: withPositiveExpenseAddendum(
        "gastos reais",
        insights.ytdPositiveExpenses,
      ),
      info: "Total de despesas reais no ano corrente (de janeiro até hoje). Investimentos são mostrados à parte.",
      comparison: expensesComparison,
      icon: CalendarIcon,
      variant: "expense",
    },
    {
      title: "Saldo (ano)",
      value: formatCurrency({ amount: insights.ytdBalance }),
      info: "Entradas menos saídas brutas do ano corrente — reflete o que saiu da conta, incluindo investimentos.",
      trend: insights.ytdBalance >= 0 ? "up" : "down",
      icon: CalendarIcon,
    },
  ];
});

// --- Group: resumo mensal (12m) — aggregate totals only ---
const twelveMonthInfo: Record<ITwelveMonthInsightRow["key"], string> = {
  expenses:
    "Média e mediana das despesas totais por mês, considerando só os meses com movimento dos últimos 12 meses.",
  income:
    "Média e mediana das receitas totais por mês, considerando só os meses com movimento dos últimos 12 meses.",
};

const twelveMonthVariant: Record<
  ITwelveMonthInsightRow["key"],
  ICardModel["variant"]
> = {
  expenses: "expense",
  income: "deposit",
};

const totalsCards = computed<ICardModel[]>(() =>
  props.twelveMonthInsights.map((row) => ({
    title: row.label,
    value: formatCurrency({ amount: row.average }),
    subtitle: `mediana ${formatCurrency({ amount: row.median })} · ${row.activeMonths} ${row.activeMonths === 1 ? "mês" : "meses"} com movimento`,
    info: twelveMonthInfo[row.key],
    icon: BarChart3Icon,
    variant: twelveMonthVariant[row.key],
  })),
);

// --- Group: hábitos de consumo (ticket médio, concentração, recorrência) ---
const habitCards = computed<ICardModel[]>(() => {
  const cards: ICardModel[] = [];

  for (const item of props.ticketFrequency) {
    cards.push({
      title: item.name,
      value: formatCurrency({ amount: item.averageTicket }),
      subtitle: `${item.count} ${item.count === 1 ? "compra" : "compras"} · ${formatCurrency({ amount: item.total })} no período`,
      info: "Valor médio por transação (total ÷ nº de compras) desta categoria no período selecionado.",
      icon: ShoppingCartIcon,
      variant: "expense",
    });
  }

  const cr = props.concentrationRecurrence;
  if (cr && cr.topCategories.length > 0 && cr.topCategoryShare > 0) {
    cards.push({
      title: "Concentração (top 3)",
      value: `${cr.topCategoryShare.toFixed(0)}%`,
      subtitle: cr.topCategories.map((c) => c.name).join(", "),
      info: "Percentual do gasto do período concentrado nas 3 maiores categorias. Quanto maior, mais o orçamento depende de poucas categorias.",
      icon: LayersIcon,
    });
  }
  if (cr && cr.recurringCounterparties.length > 0) {
    cards.push({
      title: "Gastos recorrentes",
      value: `${cr.recurringCounterparties.length} ${cr.recurringCounterparties.length === 1 ? "detectado" : "detectados"}`,
      subtitle: cr.recurringCounterparties
        .slice(0, 4)
        .map((c) => c.name)
        .join(", "),
      info: "Identificadores presentes em pelo menos 80% dos últimos 12 meses — candidatos a contas fixas/assinaturas.",
      icon: RepeatIcon,
    });
  }

  return cards;
});

// --- Group: histórico (averages over all recorded months) ---
const historyCards = computed<ICardModel[]>(() => {
  const insights = props.insights;
  if (!insights) return [];

  return [
    {
      title: "Ganho médio mensal",
      value: formatCurrency({ amount: insights.averageMonthlyIncome }),
      subtitle: "baseado em todo o histórico",
      info: "Média de entradas por mês considerando todo o histórico registrado.",
      icon: BarChart3Icon,
      variant: "deposit",
    },
    {
      title: "Gasto médio mensal",
      value: formatCurrency({ amount: insights.averageMonthlySpending }),
      subtitle: withPositiveExpenseAddendum(
        "baseado em todo o histórico",
        insights.averageMonthlyPositiveExpenses,
      ),
      info: "Média de despesas reais por mês considerando todo o histórico. Investimentos mostrados à parte.",
      icon: BarChart3Icon,
      variant: "expense",
    },
  ];
});

// Whether there is anything behind the "Ver tudo" toggle — hides the button when
// every block is already always-visible.
const hasExpandable = computed(
  () =>
    periodExtraCards.value.length > 0 ||
    yearCards.value.length > 0 ||
    habitCards.value.length > 0 ||
    historyCards.value.length > 0,
);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">Insights</h2>
      <button
        v-if="hasExpandable"
        type="button"
        class="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        @click="expanded = !expanded"
      >
        {{ expanded ? "Ver menos" : "Ver tudo" }}
        <component :is="expanded ? ChevronUpIcon : ChevronDownIcon" class="h-4 w-4" />
      </button>
    </div>

    <!-- Always visible: taxa de poupança + resumo mensal + médias por categoria -->
    <div
      v-if="savingsCard"
      class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      <InsightCard v-bind="savingsCard" :loading="loading" />
    </div>

    <InsightGroup
      v-if="totalsCards.length > 0"
      title="Resumo mensal (12m)"
      subtitle="Médias dos últimos 12 meses — considera só os meses com movimento"
    >
      <InsightCard
        v-for="(card, index) in totalsCards"
        :key="`totals-${index}`"
        v-bind="card"
        :loading="loading"
      />
    </InsightGroup>

    <InsightGroup
      v-if="keyCategoryInsights.length > 0"
      title="Médias por categoria (12m)"
      subtitle="Entrada e saída típicas das categorias-chave — meses com movimento"
    >
      <CategoryAverageCard
        v-for="insight in keyCategoryInsights"
        :key="insight.id"
        :insight="insight"
        :loading="loading"
      />
    </InsightGroup>

    <!-- Behind "Ver tudo" -->
    <template v-if="expanded">
      <InsightGroup
        v-if="periodExtraCards.length > 0"
        title="Período selecionado"
        subtitle="Segue o seletor de meses acima"
      >
        <InsightCard
          v-for="(card, index) in periodExtraCards"
          :key="`period-${index}`"
          v-bind="card"
          :loading="loading"
        />
      </InsightGroup>

      <InsightGroup
        v-if="yearCards.length > 0"
        title="Ano corrente"
        subtitle="De janeiro até hoje — independe do seletor"
      >
        <InsightCard
          v-for="(card, index) in yearCards"
          :key="`year-${index}`"
          v-bind="card"
          :loading="loading"
        />
      </InsightGroup>

      <InsightGroup
        v-if="habitCards.length > 0"
        title="Hábitos de consumo"
        subtitle="Ticket médio do período e padrões recorrentes"
      >
        <InsightCard
          v-for="(card, index) in habitCards"
          :key="`habit-${index}`"
          v-bind="card"
          :loading="loading"
        />
      </InsightGroup>

      <InsightGroup
        v-if="historyCards.length > 0"
        title="Histórico"
        subtitle="Média de todos os meses registrados"
      >
        <InsightCard
          v-for="(card, index) in historyCards"
          :key="`history-${index}`"
          v-bind="card"
          :loading="loading"
        />
      </InsightGroup>
    </template>
  </div>
</template>
