<script setup lang="ts">
import type { ITransaction } from "~/@schemas/models/transaction";
import {
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { UiButton } from "~/components/ui/button";

type IProps = {
  transactions: ITransaction[];
};

const props = defineProps<IProps>();

const formatDate = (timestamp: any) => {
  const date = timestamp.toDate();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatAmount = (transaction: ITransaction) => {
  const amount = Math.abs(transaction.amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  return transaction.type === "deposit" ? `+${formatted}` : `-${formatted}`;
};
</script>

<template>
  <UiCard>
    <UiCardHeader class="flex flex-row items-center justify-between">
      <UiCardTitle>Recent Transactions</UiCardTitle>
      <UiButton
        variant="ghost"
        size="sm"
        @click="navigateTo('/dashboard/transactions')"
      >
        View All
      </UiButton>
    </UiCardHeader>
    <UiCardContent>
      <div v-if="transactions.length === 0" class="text-center py-8 text-muted-foreground">
        No transactions yet
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="transaction in transactions.slice(0, 10)"
          :key="transaction.id"
          class="flex items-center justify-between"
        >
          <div class="flex-1">
            <div class="font-medium">{{ transaction.description }}</div>
            <div class="text-sm text-muted-foreground">
              {{ formatDate(transaction.date) }}
            </div>
          </div>
          <div
            class="font-medium"
            :class="
              transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
            "
          >
            {{ formatAmount(transaction) }}
          </div>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>
