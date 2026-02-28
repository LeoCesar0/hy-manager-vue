<script setup lang="ts">
import { TrendingUpIcon, TrendingDownIcon, WalletIcon } from "lucide-vue-next";
import type { ITransaction } from "~/@schemas/models/transaction";
import { calculateTotals } from "~/services/analytics/calculate-totals";
import { formatCurrency } from "~/helpers/formatCurrency";

type IProps = {
  transactions: ITransaction[];
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const totals = computed(() => {
  if (!props.transactions || props.transactions.length === 0) {
    return { income: 0, expenses: 0, balance: 0 };
  }
  return calculateTotals(props.transactions);
});
</script>

<template>
  <div class="grid gap-4 md:grid-cols-3">
    <UiCard class="p-6">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Total de Receitas</p>
          <p v-if="loading" class="h-8 w-32 bg-muted animate-pulse rounded" />
          <p v-else class="text-2xl font-bold text-deposit">
            {{ formatCurrency({ amount: totals.income }) }}
          </p>
        </div>
        <div class="h-12 w-12 rounded-full bg-deposit/10 flex items-center justify-center">
          <TrendingUpIcon class="h-6 w-6 text-deposit" />
        </div>
      </div>
    </UiCard>

    <UiCard class="p-6">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Total de Despesas</p>
          <p v-if="loading" class="h-8 w-32 bg-muted animate-pulse rounded" />
          <p v-else class="text-2xl font-bold text-expense">
            {{ formatCurrency({ amount: totals.expenses }) }}
          </p>
        </div>
        <div class="h-12 w-12 rounded-full bg-expense/10 flex items-center justify-center">
          <TrendingDownIcon class="h-6 w-6 text-expense" />
        </div>
      </div>
    </UiCard>

    <UiCard class="p-6">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Saldo</p>
          <p v-if="loading" class="h-8 w-32 bg-muted animate-pulse rounded" />
          <p 
            v-else 
            class="text-2xl font-bold"
            :class="totals.balance >= 0 ? 'text-primary' : 'text-expense'"
          >
            {{ formatCurrency({ amount: totals.balance }) }}
          </p>
        </div>
        <div 
          class="h-12 w-12 rounded-full flex items-center justify-center"
          :class="totals.balance >= 0 ? 'bg-primary/10' : 'bg-expense/10'"
        >
          <WalletIcon 
            class="h-6 w-6"
            :class="totals.balance >= 0 ? 'text-primary' : 'text-expense'"
          />
        </div>
      </div>
    </UiCard>
  </div>
</template>
