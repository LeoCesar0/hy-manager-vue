<script setup lang="ts">
import BarChart from "~/components/Charts/BarChart.vue";

export type IMonthlyTrendPoint = {
  label: string;
  expenses: number;
  deposits: number;
};

type IProps = {
  data: IMonthlyTrendPoint[];
  title?: string;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  title: "Tendência Mensal",
  loading: false,
});

type ViewMode = "all" | "deposits" | "expenses";

const viewMode = ref<ViewMode>("all");

const viewOptions: { value: ViewMode; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "deposits", label: "Entradas" },
  { value: "expenses", label: "Saídas" },
];

const expenseSeries = {
  key: "expenses",
  label: "Saídas",
  color: "var(--expense)",
  accessor: (d: IMonthlyTrendPoint) => d.expenses,
};

const depositSeries = {
  key: "deposits",
  label: "Entradas",
  color: "var(--deposit)",
  accessor: (d: IMonthlyTrendPoint) => d.deposits,
};

// @unovis has no built-in series visibility control, so the toggle drives the
// chart by swapping which series are passed in — the same pattern the overview
// bar chart uses for its investment toggle. Expense stays first to preserve the
// original (Saídas, Entradas) ordering when both are shown.
const series = computed(() => {
  if (viewMode.value === "deposits") return [depositSeries];
  if (viewMode.value === "expenses") return [expenseSeries];
  return [expenseSeries, depositSeries];
});
</script>

<template>
  <BarChart
    :title="title"
    :data="data"
    :series="series"
    :loading="loading"
  >
    <template #headerActions>
      <div class="flex items-center gap-1">
        <UiButton
          v-for="option in viewOptions"
          :key="option.value"
          size="sm"
          :variant="viewMode === option.value ? 'default' : 'ghost'"
          @click="viewMode = option.value"
        >
          {{ option.label }}
        </UiButton>
      </div>
    </template>
  </BarChart>
</template>
