<script setup lang="ts">
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-vue-next";
import type { Component } from "vue";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";

type IProps = {
  title: string;
  value: string;
  subtitle?: string;
  comparison?: { label: string; value: string };
  icon?: Component;
  trend?: "up" | "down" | "neutral";
  variant?: "expense" | "deposit";
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const accentClasses = computed(() => {
  if (props.variant === "expense") return "border-l-4 border-expense";
  if (props.variant === "deposit") return "border-l-4 border-deposit";
  return "";
});

const trendIcon = computed(() => {
  if (props.trend === "up") return TrendingUpIcon;
  if (props.trend === "down") return TrendingDownIcon;
  return MinusIcon;
});

const trendColor = computed(() => {
  if (props.trend === "up") return "text-deposit";
  if (props.trend === "down") return "text-expense";
  return "text-muted-foreground";
});
</script>

<template>
  <UiCard class="p-4" :class="accentClasses">
    <div class="flex items-start justify-between">
      <div class="space-y-1 min-w-0 flex-1">
        <p class="text-xs font-medium text-muted-foreground">{{ title }}</p>
        <UiSkeleton v-if="loading" class="h-6 w-24" />
        <p v-else class="text-lg font-semibold truncate">{{ value }}</p>
        <p v-if="subtitle && !loading" class="text-xs text-muted-foreground truncate">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="trend && !loading" class="shrink-0 ml-2">
        <component :is="trendIcon" class="h-4 w-4" :class="trendColor" />
      </div>
      <div v-else-if="icon && !loading" class="shrink-0 ml-2">
        <component :is="icon" class="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
    <div v-if="comparison && !loading" class="mt-2 pt-2 border-t">
      <p class="text-xs text-muted-foreground">
        {{ comparison.label }}: <span class="font-medium text-foreground">{{ comparison.value }}</span>
      </p>
    </div>
  </UiCard>
</template>
