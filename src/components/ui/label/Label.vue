<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue";
import { Label, type LabelProps } from "radix-vue";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-vue-next";

const props = defineProps<
  LabelProps & {
    class?: HTMLAttributes["class"];
    required?: boolean;
    labelInfo?: string;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<!-- <template>
  <span :class="cn('flex items-center gap-3', props.class)">
    <Label
      v-bind="delegatedProps"
      :class="
        cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        )
      "
    >
      <slot />{{ required ? " *" : "" }}
    </Label>
    <UiTooltipProvider v-if="labelInfo">
      <UiTooltip>
        <UiTooltipTrigger>
          <InfoIcon class="h-4 w-4" />
        </UiTooltipTrigger>
        <UiTooltipContent>
          <p class="text-xs">{{ labelInfo }}</p>
        </UiTooltipContent>
      </UiTooltip>
    </UiTooltipProvider>
  </span>
</template> -->

<template>
  <span :class="cn('flex items-center gap-1', props.class)">
    <Label
      v-bind="delegatedProps"
      :class="
        cn(
          'text-sm text-muted-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        )
      "
    >
      <slot />{{ required ? " *" : "" }}
    </Label>
    <UiTooltipProvider v-if="labelInfo">
      <UiTooltip>
        <UiTooltipTrigger>
          <InfoIcon class="h-4 w-4" />
        </UiTooltipTrigger>
        <UiTooltipContent>
          <p class="text-xs">{{ labelInfo }}</p>
        </UiTooltipContent>
      </UiTooltip>
    </UiTooltipProvider>
  </span>
</template>
