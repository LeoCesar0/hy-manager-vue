<script setup lang="ts">
import {
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";

type CreditorData = {
  id: string;
  name: string;
  amount: number;
};

type IProps = {
  data: CreditorData[];
  limit?: number;
};

const props = withDefaults(defineProps<IProps>(), {
  limit: 5,
});

const topCreditors = computed(() => {
  return props.data.slice(0, props.limit);
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
</script>

<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>Top Creditors</UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div v-if="topCreditors.length === 0" class="text-center py-8 text-muted-foreground">
        No creditor data available
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="creditor in topCreditors"
          :key="creditor.id"
          class="flex items-center justify-between"
        >
          <div class="font-medium">{{ creditor.name }}</div>
          <div class="text-muted-foreground">
            {{ formatCurrency(creditor.amount) }}
          </div>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>
