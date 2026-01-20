<script setup lang="ts">
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICreditor } from "~/@schemas/models/creditor";
import { getTransactions } from "~/services/api/transactions/get-transactions";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCreditors } from "~/services/api/creditors/get-creditors";
import { calculateTotals } from "~/services/analytics/calculate-totals";
import { groupByCategory } from "~/services/analytics/group-by-category";
import { groupByCreditor } from "~/services/analytics/group-by-creditor";
import { groupByDate } from "~/services/analytics/group-by-date";
import Overview from "~/components/Dashboard/Overview.vue";
import ExpensesByCategory from "~/components/Dashboard/ExpensesByCategory.vue";
import IncomeVsExpenses from "~/components/Dashboard/IncomeVsExpenses.vue";
import RecentTransactions from "~/components/Dashboard/RecentTransactions.vue";
import TopCreditors from "~/components/Dashboard/TopCreditors.vue";
import MonthlyComparison from "~/components/Dashboard/MonthlyComparison.vue";
import { UiButton } from "~/components/ui/button";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const transactions = ref<ITransaction[]>([]);
const categories = ref<ICategory[]>([]);
const creditors = ref<ICreditor[]>([]);
const loading = ref(false);

const totals = computed(() => calculateTotals(transactions.value));
const expensesByCategory = computed(() => {
  const expenses = transactions.value.filter((t) => t.type === "expense");
  return groupByCategory(expenses, categories.value);
});
const topCreditors = computed(() => groupByCreditor(transactions.value, creditors.value));
const monthlyData = computed(() => groupByDate(transactions.value, "monthly"));

const loadData = async () => {
  if (!currentUser.value) return;

  loading.value = true;

  const [transactionsResult, categoriesResult, creditorsResult] = await Promise.all([
    getTransactions({ userId: currentUser.value.id }),
    getCategories({ userId: currentUser.value.id }),
    getCreditors({ userId: currentUser.value.id }),
  ]);

  if (transactionsResult.data) transactions.value = transactionsResult.data;
  if (categoriesResult.data) categories.value = categoriesResult.data;
  if (creditorsResult.data) creditors.value = creditorsResult.data;

  loading.value = false;
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-muted-foreground">Overview of your finances</p>
      </div>
      <UiButton @click="navigateTo('/dashboard/transactions/new')">
        Add Transaction
      </UiButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <div v-else class="space-y-6">
      <Overview
        :income="totals.income"
        :expenses="totals.expenses"
        :balance="totals.balance"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensesByCategory :data="expensesByCategory" />
        <IncomeVsExpenses :data="monthlyData" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions :transactions="transactions" />
        <div class="space-y-6">
          <TopCreditors :data="topCreditors" />
          <MonthlyComparison :data="monthlyData" />
        </div>
      </div>
    </div>
  </div>
</template>
