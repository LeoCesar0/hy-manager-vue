<script setup lang="ts">
import { Timestamp } from "firebase/firestore";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import DashboardFilterBar from "~/components/Dashboard/DashboardFilterBar.vue";
import SummaryCards from "~/components/Transactions/SummaryCards.vue";
import DonutChart from "~/components/Dashboard/DonutChart.vue";
import InsightsGrid from "~/components/Dashboard/InsightsGrid.vue";

definePageMeta({
  layout: "dashboard",
});

const dashboardStore = useDashboardStore();
const { currentBankAccount } = storeToRefs(dashboardStore);

const {
  filters,
  selectedPeriod,
  handleSelectPeriod,
  isLoading,
  totals,
  expensesByCategory,
  depositsByCategory,
  expensesByCounterparty,
  depositsByCounterparty,
  insights,
  filteredTransactions,
  loadData,
  clearFilters,
} = useDashboardAnalytics();

const handleUpdateStartDate = (value: Timestamp | null) => {
  filters.value.startDate = value;
};

const handleUpdateEndDate = (value: Timestamp | null) => {
  filters.value.endDate = value;
};

watch(
  () => currentBankAccount.value?.id,
  () => {
    loadData();
  }
);

onMounted(() => {
  loadData();
});
</script>

<template>
  <DashboardSection
    title="Painel Geral"
    subtitle="Visão geral das suas finanças"
    :loading="isLoading && filteredTransactions.length === 0"
  >
    <template #filters>
      <DashboardFilterBar
        :selected-period="selectedPeriod"
        :start-date="filters.startDate"
        :end-date="filters.endDate"
        :on-select-period="handleSelectPeriod"
        :on-update-start-date="handleUpdateStartDate"
        :on-update-end-date="handleUpdateEndDate"
        :on-clear="clearFilters"
      />
    </template>

    <SummaryCards :totals="totals" :loading="isLoading" />

    <div class="grid gap-4 md:grid-cols-2">
      <DonutChart
        title="Saídas por Categoria"
        :data="expensesByCategory"
        :loading="isLoading"
        empty-message="Nenhuma despesa no período"
      />
      <DonutChart
        title="Saídas por Terceiro"
        :data="expensesByCounterparty"
        :loading="isLoading"
        empty-message="Nenhuma despesa com terceiro no período"
      />
      <DonutChart
        title="Entradas por Categoria"
        :data="depositsByCategory"
        :loading="isLoading"
        empty-message="Nenhuma receita no período"
      />
      <DonutChart
        title="Entradas por Terceiro"
        :data="depositsByCounterparty"
        :loading="isLoading"
        empty-message="Nenhuma receita com terceiro no período"
      />
    </div>

    <InsightsGrid :insights="insights" :loading="isLoading" />
  </DashboardSection>
</template>
