<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";
import { UiBadge } from "~/components/ui/badge";

type IProps = {
  category: ICategory;
};

const props = defineProps<IProps>();

const badgeStyle = computed(() => {
  if (!props.category.color) return {};
  return {
    backgroundColor: props.category.color + "20",
    color: props.category.color,
    borderColor: props.category.color,
  };
});
</script>

<template>
  <UiBadge :style="badgeStyle" variant="outline">
    <span v-if="category.icon" class="mr-1">{{ category.icon }}</span>
    {{ category.name }}
  </UiBadge>
</template>
