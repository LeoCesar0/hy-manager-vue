<script setup lang="ts">
import { VisXYContainer, VisGroupedBar, VisAxis, VisTooltip } from "@unovis/vue";
import { GroupedBar } from "@unovis/ts";
import { ChartContainer, type ChartConfig } from "~/components/ui/chart";
import { formatCurrency } from "~/helpers/formatCurrency";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";

type DataItem = {
  label: string;
  income: number;
  expenses: number;
};

type IProps = {
  data: DataItem[];
  loading?: boolean;
  title: string;
  emptyMessage?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  emptyMessage: "Sem dados para exibir",
});

const chartConfig = computed<ChartConfig>(() => ({
  income: {
    label: "Entradas",
    color: "var(--deposit)",
  },
  expenses: {
    label: "Saídas",
    color: "var(--expense)",
  },
}));

const x = (_: DataItem, i: number) => i;
const y = [
  (d: DataItem) => d.income,
  (d: DataItem) => d.expenses,
];

const barColors = ["var(--deposit)", "var(--expense)"];

const tickFormat = (i: number) => {
  const item = props.data[i];
  return item?.label ?? "";
};

const tooltipTriggers = computed(() => ({
  [GroupedBar.selectors.bar]: (d: { data: DataItem }) => {
    const item = d.data;
    const income = formatCurrency({ amount: item.income });
    const expenses = formatCurrency({ amount: item.expenses });

    return `<div style="
      background: var(--background, hsl(0 0% 100%));
      border: 1px solid color-mix(in oklch, var(--border, hsl(240 5.9% 90%)) 50%, transparent);
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    ">
      <div style="font-weight: 500; color: var(--foreground); margin-bottom: 0.25rem;">${item.label}</div>
      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--deposit);">
        <span>Entradas:</span>
        <span style="font-weight: 600; font-family: ui-monospace, monospace;">${income}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--expense);">
        <span>Saídas:</span>
        <span style="font-weight: 600; font-family: ui-monospace, monospace;">${expenses}</span>
      </div>
    </div>`;
  },
}));
</script>

<template>
  <UiCard class="p-6">
    <h3 class="text-sm font-medium text-muted-foreground mb-4">{{ title }}</h3>

    <div v-if="loading" class="flex flex-col items-center gap-4">
      <UiSkeleton class="h-[250px] w-full" />
    </div>

    <div v-else-if="data.length === 0" class="flex items-center justify-center h-[250px]">
      <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
    </div>

    <div v-else>
      <ChartContainer :config="chartConfig" class="h-[250px]">
        <VisXYContainer :data="data" :padding="{ top: 10 }">
          <VisGroupedBar
            :x="x"
            :y="y"
            :color="barColors"
            :barPadding="0.2"
            :groupPadding="0.1"
            :roundedCorners="4"
          />
          <VisAxis type="x" :tickFormat="tickFormat" :gridLine="false" />
          <VisAxis type="y" :tickFormat="(v: number) => formatCurrency({ amount: v })" :gridLine="true" />
          <VisTooltip :triggers="tooltipTriggers" :followCursor="true" />
        </VisXYContainer>
      </ChartContainer>

      <div class="flex items-center justify-center gap-6 mt-4">
        <div class="flex items-center gap-1.5 text-xs">
          <div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-deposit" />
          <span class="text-muted-foreground">Entradas</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs">
          <div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-expense" />
          <span class="text-muted-foreground">Saídas</span>
        </div>
      </div>
    </div>
  </UiCard>
</template>
