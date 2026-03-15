<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip } from "@unovis/vue";
import { Line } from "@unovis/ts";
import { ChartContainer, type ChartConfig } from "~/components/ui/chart";
import { formatCurrency } from "~/helpers/formatCurrency";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";

type SeriesConfig = {
  key: string;
  label: string;
  color: string;
};

type IProps = {
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  loading?: boolean;
  title: string;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
  emptyMessage: "Sem dados para exibir",
  formatValue: (v: number) => formatCurrency({ amount: v }),
});

const chartConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  for (const s of props.series) {
    config[s.key] = { label: s.label, color: s.color };
  }
  return config;
});

const x = (_: Record<string, unknown>, i: number) => i;

const yAccessors = computed(() =>
  props.series.map((s) => (d: Record<string, unknown>) => (d[s.key] as number) ?? 0)
);

const lineColors = computed(() => props.series.map((s) => s.color));

const tickFormat = (i: number) => {
  const item = props.data[i];
  return (item?.label as string) ?? "";
};

const tooltipTemplate = (d: Record<string, unknown>) => {
  const lines = props.series
    .map((s) => {
      const val = (d[s.key] as number) ?? 0;
      return `<div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 8px; height: 8px; border-radius: 2px; background: ${s.color};"></div>
        <span>${s.label}:</span>
        <span style="font-weight: 600; font-family: ui-monospace, monospace;">${props.formatValue(val)}</span>
      </div>`;
    })
    .join("");

  return `<div style="
    background: var(--background, hsl(0 0% 100%));
    border: 1px solid color-mix(in oklch, var(--border, hsl(240 5.9% 90%)) 50%, transparent);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  ">
    <div style="font-weight: 500; color: var(--foreground); margin-bottom: 0.25rem;">${(d.label as string) ?? ""}</div>
    ${lines}
  </div>`;
};

const crosshairTemplate = (d: Record<string, unknown>) => tooltipTemplate(d);
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
      <ChartContainer :config="chartConfig" class="h-[250px]" :cursor="true">
        <VisXYContainer :data="data" :padding="{ top: 10 }">
          <VisLine
            v-for="(accessor, index) in yAccessors"
            :key="series[index]!.key"
            :x="x"
            :y="accessor"
            :color="lineColors[index]"
            :curveType="'monotoneX'"
          />
          <VisAxis type="x" :tickFormat="tickFormat" :gridLine="false" />
          <VisAxis type="y" :gridLine="true" />
          <VisCrosshair :template="crosshairTemplate" />
        </VisXYContainer>
      </ChartContainer>

      <div class="flex items-center justify-center gap-6 mt-4">
        <div
          v-for="s in series"
          :key="s.key"
          class="flex items-center gap-1.5 text-xs"
        >
          <div
            class="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            :style="{ backgroundColor: s.color }"
          />
          <span class="text-muted-foreground">{{ s.label }}</span>
        </div>
      </div>
    </div>
  </UiCard>
</template>
