<script setup lang="ts">
import type { IKeyCategoryInsight } from "~/services/analytics/calculate-key-category-insights";
import type { IWindowStats } from "~/services/analytics/aggregate-monthly-window";
import { getCategoryIcon } from "~/static/category-icons";
import { formatCurrency } from "~/helpers/formatCurrency";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";

type IProps = {
  insight: IKeyCategoryInsight;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

type IFlowRow = {
  flow: "expense" | "deposit";
  label: string;
  stats: IWindowStats;
  dominant: boolean;
};

const emoji = computed(() => getCategoryIcon(props.insight.icon));

const accentStyle = computed(() =>
  props.insight.color ? { borderLeftColor: props.insight.color } : undefined,
);

// Dominant flow first (emphasized); the other is shown discreetly and only when
// it actually had movement in the window.
const rows = computed<IFlowRow[]>(() => {
  const { dominantFlow, expense, deposit } = props.insight;

  const expenseRow: IFlowRow = {
    flow: "expense",
    label: "Saída",
    stats: expense,
    dominant: dominantFlow === "expense",
  };
  const depositRow: IFlowRow = {
    flow: "deposit",
    label: "Entrada",
    stats: deposit,
    dominant: dominantFlow === "deposit",
  };

  const ordered = dominantFlow === "deposit"
    ? [depositRow, expenseRow]
    : [expenseRow, depositRow];

  // Always keep the dominant row; drop the secondary row when it has no movement.
  return ordered.filter((row) => row.dominant || row.stats.total > 0);
});

const activeMonthsLabel = computed(() => {
  const dominant = rows.value.find((row) => row.dominant);
  if (!dominant) return "";
  const n = dominant.stats.activeMonths;
  return n === 1 ? "1 mês com movimento" : `${n} meses com movimento`;
});
</script>

<template>
  <UiCard class="p-4 border-l-4" :style="accentStyle">
    <div class="flex items-center gap-2 min-w-0">
      <span v-if="emoji" class="text-lg leading-none shrink-0" aria-hidden="true">
        {{ emoji }}
      </span>
      <p class="text-sm font-medium truncate">{{ insight.name }}</p>
    </div>

    <div class="mt-3 space-y-2">
      <div
        v-for="row in rows"
        :key="row.flow"
        :class="row.dominant ? '' : 'opacity-70'"
      >
        <div class="flex items-baseline justify-between gap-2">
          <span
            class="text-xs text-muted-foreground shrink-0"
            :class="{ 'text-expense': row.flow === 'expense' && row.dominant, 'text-deposit': row.flow === 'deposit' && row.dominant }"
          >
            {{ row.label }}
          </span>
          <UiSkeleton v-if="loading" class="h-5 w-20" />
          <span
            v-else
            class="font-semibold truncate"
            :class="row.dominant ? 'text-lg' : 'text-sm'"
          >
            {{ formatCurrency({ amount: row.stats.average }) }}
          </span>
        </div>
        <p v-if="!loading" class="text-[11px] text-muted-foreground text-right">
          mediana {{ formatCurrency({ amount: row.stats.median }) }}
        </p>
      </div>
    </div>

    <p v-if="!loading && activeMonthsLabel" class="mt-2 pt-2 border-t text-[11px] text-muted-foreground">
      {{ activeMonthsLabel }}
    </p>
  </UiCard>
</template>
