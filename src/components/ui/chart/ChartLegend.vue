<script setup lang="ts">
import { VisBulletLegend } from "@unovis/vue";
import type { BulletLegendItemInterface } from "@unovis/ts";
import { BulletLegend } from "@unovis/ts";
import { nextTick, onMounted, ref } from "vue";
import { buttonVariants } from "@/components/ui/button";
import { beautifyObjectName } from "~/helpers/shadcnui-utils/auto-form";

const props = withDefaults(
  defineProps<{ items: BulletLegendItemInterface[] }>(),
  {
    items: () => [],
  }
);

const mappedNames = ref<
  Map<
    (typeof props.items)[number]["name"],
    (typeof props.items)[number]["name"]
  >
>(new Map());

const getMappedName = (name: (typeof props.items)[number]["name"]) => {
  return mappedNames.value.get(name) || name;
};

const setListLabels = (items: typeof props.items) => {
  return items.map((item) => {
    if (typeof item.name === "string") {
      const label = beautifyObjectName(item.name);
      mappedNames.value.set(label, item.name);
      return {
        ...item,
        name: label,
      };
    } else {
      mappedNames.value.set(item.name, item.name);
      return item;
    }
  });
};

const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number];
  "update:items": [payload: BulletLegendItemInterface[]];
}>();

const elRef = ref<HTMLElement>();

onMounted(() => {
  const selector = `.${BulletLegend.selectors.item}`;
  nextTick(() => {
    const elements = elRef.value?.querySelectorAll(selector);
    const classes = buttonVariants({ variant: "ghost", size: "xs" }).split(" ");

    elements?.forEach((el) =>
      el.classList.add(...classes, "!inline-flex", "!mr-2")
    );
  });
});

const isSameItem = (
  a: BulletLegendItemInterface,
  b: BulletLegendItemInterface
) => {
  const aName = getMappedName(a.name);
  const bName = getMappedName(b.name);
  const result = aName === bName;
  return result;
};

function onLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits("legendItemClick", d, i);
  const isBulletActive = !props.items[i].inactive;
  const isFilterApplied = props.items.some((i) => i.inactive);
  if (isFilterApplied && isBulletActive) {
    // reset filter
    const newItems = props.items.map((item) => ({ ...item, inactive: false }));
    emits("update:items", newItems);
  } else {
    // apply selection, set other item as inactive
    const newItems = props.items.map((item) =>
      isSameItem(item, d)
        ? { ...item, inactive: false }
        : { ...item, inactive: true }
    );
    emits("update:items", newItems);
  }
}
</script>

<template>
  <div ref="elRef" class="w-max">
    <VisBulletLegend
      :items="setListLabels(items)"
      :on-legend-item-click="onLegendItemClick"
    />
  </div>
</template>
