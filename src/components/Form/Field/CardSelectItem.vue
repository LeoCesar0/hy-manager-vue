<script setup lang="ts">
import { cn } from "@/lib/utils";

export type ICardSelectOption = {
  label: string;
  description: string;
  textColor?: string; // Full Tailwind class name
  bgColor?: string; // Full Tailwind class name
  value: any;
  selected?: boolean;
  class?: string;
};

const props = defineProps<ICardSelectOption>();
const emit = defineEmits<{
  (e: "select", value: any): void;
}>();

const handleSelect = () => {
  emit("select", props.value);
};
</script>

<template>
  <button
    :class="
      cn(
        'flex flex-col items-center p-3 rounded-lg border transition-all duration-200',
        'hover:brightness-110',
        {
          'border-accent ring-4 ring-accent/50 bg-accent/5': selected,
          'border-border bg-card opacity-80': !selected,
        },
        props.class
      )
    "
    type="button"
    @click="handleSelect"
  >
    <span class="text-sm font-medium">{{ label }}</span>
    <span class="text-xs">{{ description }}</span>
  </button>
</template>
