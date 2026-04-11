<script setup lang="ts">
import { Timestamp } from "firebase/firestore";
import { RefreshCwIcon } from "lucide-vue-next";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import DashboardFilterBar from "~/components/Dashboard/DashboardFilterBar.vue";
import SummaryCards from "~/components/Transactions/SummaryCards.vue";
import DonutChart from "~/components/Dashboard/DonutChart.vue";
import InsightsGrid from "~/components/Dashboard/InsightsGrid.vue";
import UncategorizedBanner from "~/components/Counterparties/UncategorizedBanner.vue";

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
  isRebuilding,
  handleRebuildReport,
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

const { uncategorizedCount, loadData: loadUncategorized } = useCounterpartiesCategorization();

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
  loadUncategorized();
});
</script>

<template>
  <DashboardSection
    title="Painel Geral"
    subtitle="Visão geral das suas finanças"
    :loading="isLoading && filteredTransactions.length === 0"
  >
    <template #actions>
      <UiButton
        variant="outline"
        size="sm"
        :disabled="isRebuilding"
        @click="handleRebuildReport"
      >
        <RefreshCwIcon class="h-4 w-4 mr-1" :class="{ 'animate-spin': isRebuilding }" />
        Recalcular
      </UiButton>
    </template>

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

    <!-- <UncategorizedBanner :count="uncategorizedCount" /> -->

    <SummaryCards :totals="totals" :loading="isLoading" />

    <div class="grid gap-4 md:grid-cols-2">
      <DonutChart
        title="Saídas por Categoria"
        :data="expensesByCategory"
        :loading="isLoading"
        empty-message="Nenhuma despesa no período"
        variant="expense"
        unassigned-id="uncategorized"
        toggle-label="sem categoria"
      />
      <DonutChart
        title="Saídas por Identificador"
        :data="expensesByCounterparty"
        :loading="isLoading"
        empty-message="Nenhuma despesa com identificador no período"
        variant="expense"
        unassigned-id="no-counterparty"
        toggle-label="sem identificador"
      />
      <DonutChart
        title="Entradas por Categoria"
        :data="depositsByCategory"
        :loading="isLoading"
        empty-message="Nenhuma receita no período"
        variant="deposit"
        unassigned-id="uncategorized"
        toggle-label="sem categoria"
      />
      <DonutChart
        title="Entradas por Identificador"
        :data="depositsByCounterparty"
        :loading="isLoading"
        empty-message="Nenhuma receita com identificador no período"
        variant="deposit"
        unassigned-id="no-counterparty"
        toggle-label="sem identificador"
      />
    </div>

    <InsightsGrid :insights="insights" :loading="isLoading" />
  </DashboardSection>
</template>
