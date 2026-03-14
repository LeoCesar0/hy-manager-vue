<script setup lang="ts">
import { VisSingleContainer, VisDonut } from "@unovis/vue";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart";
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
          <ChartTooltip>
            <template #default="{ title: tooltipTitle, payload }">
              <ChartTooltipContent
                :config="chartConfig"
                :payload="payload"
                hide-label
              />
            </template>
          </ChartTooltip>
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
