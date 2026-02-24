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
          <p v-else class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ formatCurrency({ amount: totals.income }) }}
          </p>
        </div>
        <div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <TrendingUpIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </UiCard>

    <UiCard class="p-6">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-sm font-medium text-muted-foreground">Total de Despesas</p>
          <p v-if="loading" class="h-8 w-32 bg-muted animate-pulse rounded" />
          <p v-else class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ formatCurrency({ amount: totals.expenses }) }}
          </p>
        </div>
        <div class="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <TrendingDownIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
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
            :class="totals.balance >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'"
          >
            {{ formatCurrency({ amount: totals.balance }) }}
          </p>
        </div>
        <div 
          class="h-12 w-12 rounded-full flex items-center justify-center"
          :class="totals.balance >= 0 ? 'bg-primary/10' : 'bg-red-100 dark:bg-red-900/20'"
        >
          <WalletIcon 
            class="h-6 w-6"
            :class="totals.balance >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'"
          />
        </div>
      </div>
    </UiCard>
  </div>
</template>
