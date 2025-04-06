<script setup lang="ts">
import { computed } from "vue";
import { usePreferredDark } from "@vueuse/core";
import { cn } from "~/lib/utils";

const props = withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg" | "xl";
    color?: string;
    isLoading?: boolean; // Default will be false
  }>(),
  {
    size: "xl",
  }
);

// Dark mode support
const isDark = usePreferredDark();

// Default values
const sizeClasses = computed(() => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-3",
    lg: "w-10 h-10 border-4",
    xl: "w-14 h-14 border-4",
  };
  return sizes[props.size];
});

const colorClass = computed(
  () => props.color || (isDark.value ? "border-primary" : "border-primary")
);
</script>

<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center my-4 mx-2"
    role="status"
    aria-live="polite"
  >
    <div
      :class="
        cn(
          colorClass,
          sizeClasses,
          'rounded-full animate-spin border-t-transparent'
        )
      "
    />
    <span class="sr-only">Loading...</span>
  </div>
</template>
