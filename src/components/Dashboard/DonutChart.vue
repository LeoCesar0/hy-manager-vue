<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisDonutSelectors } from "@unovis/vue";
import { ChartContainer, ChartTooltip, type ChartConfig } from "~/components/ui/chart";
import { formatCurrency } from "~/helpers/formatCurrency";
import { CATEGORY_PRESET_COLORS } from "~/static/category-colors";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";

type DataItem = {
  id: string;
  name: string;
  amount: number;
  color?: string;
};

type IProps = {
  title: string;
  data: DataItem[];
  loading?: boolean;
  emptyMessage?: string;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  emptyMessage: "Sem dados para exibir",
});

const chartConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  props.data.forEach((item, index) => {
    config[item.id] = {
      label: item.name,
      color: item.color || CATEGORY_PRESET_COLORS[index % CATEGORY_PRESET_COLORS.length]!,
    };
  });
  return config;
});

const total = computed(() =>
  props.data.reduce((sum, item) => sum + item.amount, 0)
);

const colorAccessor = (_: DataItem, index: number) => {
  const entries = Object.values(chartConfig.value);
  return entries[index]?.color ?? CATEGORY_PRESET_COLORS[index % CATEGORY_PRESET_COLORS.length]!;
};

const tooltipTriggers = computed(() => ({
  [VisDonutSelectors.segment]: (d: { data: DataItem; index: number }) => {
    const item = d.data;
    const color = colorAccessor(item, d.index);
    const amount = formatCurrency({ amount: item.amount });
    const percentage = total.value > 0
      ? ((item.amount / total.value) * 100).toFixed(1)
      : "0.0";

    return `<div style="
      background: var(--background, hsl(0 0% 100%));
      border: 1px solid color-mix(in oklch, var(--border, hsl(240 5.9% 90%)) 50%, transparent);
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      display: flex;
      align-items: stretch;
      font-size: 0.75rem;
    ">
      <div style="width: 4px; background: ${color}; flex-shrink: 0;"></div>
      <div style="padding: 0.375rem 0.625rem; display: flex; align-items: center; gap: 0.625rem;">
        <span style="color: var(--foreground, hsl(240 10% 3.9%)); font-weight: 500;">${item.name}</span>
        <span style="font-weight: 600; font-family: ui-monospace, monospace; white-space: nowrap;">${amount}</span>
        <span style="
          color: var(--muted-foreground, hsl(240 3.8% 46.1%));
          font-family: ui-monospace, monospace;
          font-size: 0.6875rem;
        ">${percentage}%</span>
      </div>
    </div>`;
  },
}));
</script>

<template>
  <UiCard class="p-6">
    <h3 class="text-sm font-medium text-muted-foreground mb-4">{{ title }}</h3>

    <div v-if="loading" class="flex flex-col items-center gap-4">
      <UiSkeleton class="h-[200px] w-[200px] rounded-full" />
      <div class="flex gap-4">
        <UiSkeleton class="h-4 w-20" />
        <UiSkeleton class="h-4 w-20" />
      </div>
    </div>

    <div v-else-if="data.length === 0" class="flex items-center justify-center h-[200px]">
      <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
    </div>

    <div v-else>
      <ChartContainer :config="chartConfig" class="h-[250px]">
        <VisSingleContainer :data="data">
          <VisDonut
            :value="(d: DataItem) => d.amount"
            :color="colorAccessor"
            :arcWidth="40"
            :padAngle="0.02"
            :centralLabel="formatCurrency({ amount: total })"
            centralSubLabel="Total"
          />
          <ChartTooltip :triggers="tooltipTriggers" :followCursor="true" />
        </VisSingleContainer>
      </ChartContainer>

      <div class="flex flex-wrap items-center justify-center gap-3 mt-4">
        <div
          v-for="(item, index) in data.slice(0, 8)"
          :key="item.id"
          class="flex items-center gap-1.5 text-xs"
        >
          <div
            class="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            :style="{ backgroundColor: chartConfig[item.id]?.color }"
          />
          <span class="text-muted-foreground truncate max-w-[100px]">{{ item.name }}</span>
        </div>
        <span v-if="data.length > 8" class="text-xs text-muted-foreground">
          +{{ data.length - 8 }} mais
        </span>
      </div>
    </div>
  </UiCard>
</template>
