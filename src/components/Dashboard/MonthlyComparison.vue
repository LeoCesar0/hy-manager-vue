<script setup lang="ts">
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

type IProps = {
  data: MonthlyData[];
};

const props = defineProps<IProps>();

const currentMonth = computed(() => {
  if (props.data.length === 0) return null;
  return props.data[props.data.length - 1];
});

const previousMonth = computed(() => {
  if (props.data.length < 2) return null;
  return props.data[props.data.length - 2];
});

const incomeChange = computed(() => {
  if (!currentMonth.value || !previousMonth.value) return 0;
  if (previousMonth.value.income === 0) return 0;
  return (
    ((currentMonth.value.income - previousMonth.value.income) /
      previousMonth.value.income) *
    100
  );
});

const expensesChange = computed(() => {
  if (!currentMonth.value || !previousMonth.value) return 0;
  if (previousMonth.value.expenses === 0) return 0;
  return (
    ((currentMonth.value.expenses - previousMonth.value.expenses) /
      previousMonth.value.expenses) *
    100
  );
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Monthly Comparison</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="!currentMonth" class="text-center py-8 text-muted-foreground">
        Not enough data for comparison
      </div>
      <div v-else class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">Income</span>
            <div class="text-right">
              <div class="font-medium">{{ formatCurrency(currentMonth.income) }}</div>
              <div
                v-if="previousMonth"
                class="text-sm"
                :class="incomeChange >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ incomeChange >= 0 ? "+" : "" }}{{ incomeChange.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">Expenses</span>
            <div class="text-right">
              <div class="font-medium">{{ formatCurrency(currentMonth.expenses) }}</div>
              <div
                v-if="previousMonth"
                class="text-sm"
                :class="expensesChange <= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ expensesChange >= 0 ? "+" : "" }}{{ expensesChange.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
