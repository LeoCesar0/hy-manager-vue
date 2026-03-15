<script setup lang="ts">
import { Progress as UiProgress } from "~/components/ui/progress";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  label: string;
  current: number;
  target: number;
  variant: "expense" | "deposit";
  isPositiveExpense?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  isPositiveExpense: false,
});

const percentage = computed(() =>
  props.target > 0 ? Math.min((props.current / props.target) * 100, 100) : 0
);

const isOverBudget = computed(() =>
  props.variant === "expense" && props.current > props.target
);

const isPositiveOver = computed(() =>
  isOverBudget.value && props.isPositiveExpense
);

const actualPercentage = computed(() =>
  props.target > 0 ? (props.current / props.target) * 100 : 0
);

const barClass = computed(() => {
  if (isPositiveOver.value) return "[&_[data-slot=progress-indicator]]:bg-deposit";
  if (isOverBudget.value) return "[&_[data-slot=progress-indicator]]:bg-destructive";
  if (props.variant === "expense") return "[&_[data-slot=progress-indicator]]:bg-expense";
  return "[&_[data-slot=progress-indicator]]:bg-deposit";
});

const bgClass = computed(() => {
  if (isPositiveOver.value) return "bg-deposit/20";
  if (isOverBudget.value) return "bg-destructive/20";
  if (props.variant === "expense") return "bg-expense/20";
  return "bg-deposit/20";
});
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between text-sm">
      <span class="font-medium truncate">{{ label }}</span>
      <span
        class="text-xs font-mono shrink-0 ml-2"
        :class="isOverBudget ? (isPositiveOver ? 'text-deposit font-semibold' : 'text-destructive font-semibold') : 'text-muted-foreground'"
      >
        {{ formatCurrency({ amount: current }) }} / {{ formatCurrency({ amount: target }) }}
      </span>
    </div>
    <UiProgress
      :model-value="percentage"
      :class="[barClass, bgClass]"
    />
    <div class="flex justify-end">
      <span
        class="text-xs"
        :class="isOverBudget ? (isPositiveOver ? 'text-deposit' : 'text-destructive') : 'text-muted-foreground'"
      >
        {{ actualPercentage.toFixed(0) }}%
        <span v-if="isPositiveOver"> - Acima da meta!</span>
        <span v-else-if="isOverBudget"> - Acima do limite!</span>
      </span>
    </div>
  </div>
</template>
