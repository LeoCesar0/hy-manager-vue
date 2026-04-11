<script setup lang="ts" generic="Datum extends { label: string }">
import { VisXYContainer, VisGroupedBar, VisAxis, VisTooltip } from "@unovis/vue";
import { GroupedBar } from "@unovis/ts";
import { ChartContainer, type ChartConfig } from "~/components/ui/chart";
import { formatCurrency } from "~/helpers/formatCurrency";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";

type BarSeriesConfig<D> = {
  key: string;
  label: string;
  color: string;
  accessor: (d: D) => number;
};

type IProps<D> = {
  data: D[];
  series: BarSeriesConfig<D>[];
  loading?: boolean;
  title: string;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
};

const props = withDefaults(defineProps<IProps<Datum>>(), {
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

const x = (_: Datum, i: number) => i;
const y = computed(() => props.series.map((s) => s.accessor));
const barColors = computed(() => props.series.map((s) => s.color));

const tickFormat = (i: number) => {
  const item = props.data[i];
  return item?.label ?? "";
};

const tooltipTriggers = computed(() => ({
  [GroupedBar.selectors.bar]: (d: { data: Datum }) => {
    const item = d.data;
    const rows = props.series
      .map((s) => {
        const val = s.accessor(item);
        return `<div style="display: flex; align-items: center; gap: 0.5rem; color: ${s.color};">
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
      <div style="font-weight: 500; color: var(--foreground); margin-bottom: 0.25rem;">${item.label}</div>
      ${rows}
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

    <!-- `position: relative` establishes the positioning context for the
         unovis tooltip portal. Without it, VisTooltip positions against a
         further ancestor that may have unwanted overflow clipping or
         stacking context boundaries, which is why the tooltip wasn't
         rendering on the Relatórios page. -->
    <div v-else class="relative bar-chart-wrapper">
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

      <div class="flex items-center justify-center gap-6 mt-4 flex-wrap">
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

<style scoped>
/* Override unovis default cursor (CSS var --vis-grouped-bar-cursor: default)
   so users get a hover affordance on the bars. Without this, the bars look
   non-interactive even though they trigger tooltips. */
.bar-chart-wrapper :deep([data-vis-xy-container]) rect {
  cursor: pointer;
}
</style>
