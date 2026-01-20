<script setup lang="ts">
import {
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";

type IProps = {
  income: number;
  expenses: number;
  balance: number;
};

const props = defineProps<IProps>();

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle class="text-sm font-medium text-muted-foreground">
          Total Income
        </UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <div class="text-2xl font-bold text-green-600">
          {{ formatCurrency(income) }}
        </div>
      </UiCardContent>
    </UiCard>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle class="text-sm font-medium text-muted-foreground">
          Total Expenses
        </UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <div class="text-2xl font-bold text-red-600">
          {{ formatCurrency(expenses) }}
        </div>
      </UiCardContent>
    </UiCard>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle class="text-sm font-medium text-muted-foreground">
          Balance
        </UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <div
          class="text-2xl font-bold"
          :class="balance >= 0 ? 'text-green-600' : 'text-red-600'"
        >
          {{ formatCurrency(balance) }}
        </div>
      </UiCardContent>
    </UiCard>
  </div>
</template>
