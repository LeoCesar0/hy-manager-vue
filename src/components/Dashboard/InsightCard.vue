<script setup lang="ts">
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  InfoIcon,
} from "lucide-vue-next";
import type { Component } from "vue";
import { Skeleton as UiSkeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type IProps = {
  title: string;
  value: string;
  subtitle?: string;
  comparison?: { label: string; value: string };
  icon?: Component;
  trend?: "up" | "down" | "neutral";
  variant?: "expense" | "deposit";
  // Arbitrary accent color (e.g. a category's own color) for the left border and
  // icon tint. Takes precedence over `variant`. No visual change when absent.
  accentColor?: string;
  // When set, renders an "i" icon next to the title that reveals this text on
  // hover/focus — explains what the number means and how it's calculated.
  info?: string;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const accentClasses = computed(() => {
  if (props.accentColor) return "border-l-4";
  if (props.variant === "expense") return "border-l-4 border-expense";
  if (props.variant === "deposit") return "border-l-4 border-deposit";
  return "";
});

const accentStyle = computed(() =>
  props.accentColor ? { borderLeftColor: props.accentColor } : undefined,
);

const iconStyle = computed(() =>
  props.accentColor ? { color: props.accentColor } : undefined,
);

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
  <UiCard class="p-4" :class="accentClasses" :style="accentStyle">
    <div class="flex items-start justify-between">
      <div class="space-y-1 min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <p class="text-xs font-medium text-muted-foreground truncate">{{ title }}</p>
          <TooltipProvider v-if="info" :delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  type="button"
                  class="shrink-0 text-muted-foreground/70 hover:text-foreground focus-visible:text-foreground transition-colors"
                  aria-label="Mais informações"
                >
                  <InfoIcon class="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent class="max-w-[240px] text-xs leading-snug">
                {{ info }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <component
          :is="icon"
          class="h-4 w-4"
          :class="accentColor ? '' : 'text-muted-foreground'"
          :style="iconStyle"
        />
      </div>
    </div>
    <div v-if="comparison && !loading" class="mt-2 pt-2 border-t">
      <p class="text-xs text-muted-foreground">
        {{ comparison.label }}: <span class="font-medium text-foreground">{{ comparison.value }}</span>
      </p>
    </div>
  </UiCard>
</template>
