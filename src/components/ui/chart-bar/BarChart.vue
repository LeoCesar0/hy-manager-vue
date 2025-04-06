<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface, GenericDataRecord } from "@unovis/ts";
import {
  VisAxis,
  VisGroupedBar,
  VisStackedBar,
  VisXYContainer,
} from "@unovis/vue";
import { Axis, GroupedBar, StackedBar } from "@unovis/ts";
import { type Component, computed, ref } from "vue";
import { useMounted } from "@vueuse/core";
import type { BaseChartProps } from ".";
import {
  ChartCrosshair,
  ChartLegend,
  defaultColors,
  type GetCustomChartColor,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type CustomLegend = { label: string; color: string };

const props = withDefaults(
  defineProps<
    BaseChartProps<T> & {
      /**
       * Render custom tooltip component.
       */
      customTooltip?: Component;
      /**
       * Change the type of the chart
       * @default "grouped"
       */
      type?: "stacked" | "grouped";
      /**
       * Rounded bar corners
       * @default 0
       */
      roundedCorners?: number;
      getCustomColor?: GetCustomChartColor<T>;
      // customLegends?: CustomLegend[];
      keyLabels?: Record<string, string>;
    }
  >(),
  {
    type: "grouped",
    margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    filterOpacity: 0.2,
    roundedCorners: 0,
    showXAxis: true,
    showYAxis: true,
    showTooltip: true,
    showLegend: true,
    showGridLine: true,
  }
);
const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number];
}>();

type KeyOfT = Extract<keyof T, string>;
type Data = (typeof props.data)[number];

const index = computed(() => props.index as KeyOfT);
const colors = computed(() =>
  props.colors?.length ? props.colors : defaultColors(props.categories.length)
);

const customLegends = ref<CustomLegend[]>([]);

const getLegendItems = (
  categories: typeof props.categories,
  customLegends: CustomLegend[]
): BulletLegendItemInterface[] => {
  const legends: BulletLegendItemInterface[] = customLegends.map((item) => {
    return {
      name: item.label,
      color: item.color,
      inactive: false,
      pointer: false,
      className: "pointer-events-none",
    };
  });
  const items: BulletLegendItemInterface[] = categories.map((category, i) => ({
    name: category,
    color: colors.value[i],
    inactive: false,
  }));
  const resultItems = items.concat(legends);
  return resultItems;
};
const legendItems = ref<BulletLegendItemInterface[]>(
  getLegendItems(props.categories, customLegends.value)
);

watch(
  [() => props.categories, customLegends],
  ([categories, customLegends]) => {
    legendItems.value = getLegendItems(props.categories, customLegends);
  },
  {
    immediate: true,
    deep: true,
  }
);

const isMounted = useMounted();

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits("legendItemClick", d, i);
}

const VisBarComponent = computed(() =>
  props.type === "grouped" ? VisGroupedBar : VisStackedBar
);
const selectorsBar = computed(() =>
  props.type === "grouped" ? GroupedBar.selectors.bar : StackedBar.selectors.bar
);

const handleCustomColor = (d: T, i: number) => {
  const defaultColor = colors.value[i];

  if (!props.getCustomColor) {
    if (customLegends.value.length > 0) {
      customLegends.value = [];
    }
    return defaultColor;
  }

  const colorProp = props.getCustomColor(d, i);

  if (!colorProp) {
    return defaultColor;
  }
  if (!customLegends.value.find((item) => item.label === colorProp.label)) {
    customLegends.value.push(colorProp);
  }
  return colorProp.color;
};
</script>

<template>
  <div :class="cn('w-full h-[400px] flex flex-col ', $attrs.class ?? '')">
    <div class="flex items-center justify-between py-1">
      <div class="flex flex-wrap gap-4 items-center gap-2">
        <slot name="chart-header-left"></slot>
      </div>
      <div class="flex items-center gap-2">
        <slot name="chart-header-right"></slot>
        <ChartLegend
          v-if="showLegend"
          v-model:items="legendItems"
          @legend-item-click="handleLegendItemClick"
        />
      </div>
    </div>

    <VisXYContainer
      :data="data"
      :style="{ height: isMounted ? '100%' : 'auto' }"
      :margin="margin"
      :key="categories"
    >
      <ChartCrosshair
        v-if="showTooltip"
        :colors="colors"
        :items="legendItems"
        :custom-tooltip="customTooltip"
        :index="index"
        :keyLabels="keyLabels"
      />

      <VisBarComponent
        :x="(d: Data, i: number) => {
          return i
        }"
        :y="categories.map(category => (d: Data) => d[category]) "
        :color="handleCustomColor"
        :rounded-corners="roundedCorners"
        :bar-padding="0.05"
        :attributes="{
          [selectorsBar]: {
            opacity: (d: Data, i:number) => {
              const pos = i % categories.length
              return legendItems[pos]?.inactive ? filterOpacity : 1
            },
          },
        }"
      />

      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
        :grid-line="false"
        :tick-line="false"
        tick-text-color="hsl(var(--vis-text-color))"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yFormatter"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{
          [Axis.selectors.grid]: {
            class: 'text-muted',
          },
        }"
        tick-text-color="hsl(var(--vis-text-color))"
      />

      <slot />
    </VisXYContainer>
  </div>
</template>
