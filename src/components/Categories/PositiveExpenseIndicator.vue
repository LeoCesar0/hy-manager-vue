<script setup lang="ts">
import { TrendingUpIcon } from "lucide-vue-next";

type IProps = {
  variant?: "icon" | "badge";
  size?: "sm" | "md";
};

const props = withDefaults(defineProps<IProps>(), {
  variant: "icon",
  size: "sm",
});

const iconSizeClass = computed(() =>
  props.size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
);
</script>

<template>
  <UiTooltip>
    <UiTooltipTrigger as-child>
      <UiBadge
        v-if="variant === 'badge'"
        variant="secondary"
        class="text-[0.6rem] px-1.5 py-0 h-5 font-normal gap-1 cursor-help"
      >
        <TrendingUpIcon class="text-deposit shrink-0" :class="iconSizeClass" />
        gasto positivo · investimento
      </UiBadge>
      <TrendingUpIcon
        v-else
        class="text-deposit shrink-0 cursor-help"
        :class="iconSizeClass"
      />
    </UiTooltipTrigger>
    <UiTooltipContent class="max-w-xs">
      <p class="text-xs">
        Saída registrada como despesa, mas que não representa perda —
        investimento, poupança, pagamento de empréstimo ou similar.
      </p>
    </UiTooltipContent>
  </UiTooltip>
</template>
