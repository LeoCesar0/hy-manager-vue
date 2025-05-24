<script setup lang="ts">
import type { ICardSelectOption } from "./CardSelectItem.vue";
import CardSelectItem from "./CardSelectItem.vue";

type Props = {
  options: ICardSelectOption[];
  modelValue?: any;
  columns?: number;
};

const props = withDefaults(defineProps<Props>(), {
  columns: 3,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
}>();

const handleSelect = (value: any) => {
  emit("update:modelValue", value);
};

const getIsSelected = (option: ICardSelectOption) => {
  return props.modelValue === option.value;
};
</script>

<template>
  <div class="grid gap-4 !mt-2" :data-columns="columns">
    <CardSelectItem
      v-for="option in options"
      :key="option.value"
      v-bind="option"
      :selected="getIsSelected(option)"
      @select="handleSelect"
    />
  </div>
</template>

<style lang="scss" scoped>
.container {
  @apply w-full;
}

[data-columns="1"] {
  @apply grid-cols-1;
}

[data-columns="2"] {
  @apply grid-cols-2;
}

[data-columns="3"] {
  @apply grid-cols-3;
}

[data-columns="4"] {
  @apply grid-cols-4;
}

[data-columns="5"] {
  @apply grid-cols-5;
}

[data-columns="6"] {
  @apply grid-cols-6;
}
</style>
