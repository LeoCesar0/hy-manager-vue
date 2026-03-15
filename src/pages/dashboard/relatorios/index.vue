<script setup lang="ts">
import { RefreshCwIcon } from "lucide-vue-next";
import DashboardSection from "~/components/Dashboard/DashboardSection.vue";
import ReportsPeriodSelector from "~/components/Reports/ReportsPeriodSelector.vue";
import ReportsOverviewCharts from "~/components/Reports/ReportsOverviewCharts.vue";
import ReportsMonthlyComparison from "~/components/Reports/ReportsMonthlyComparison.vue";
import ReportsCategoryDrillDown from "~/components/Reports/ReportsCategoryDrillDown.vue";
import ReportsBudgetTracking from "~/components/Reports/ReportsBudgetTracking.vue";
import BudgetSettingsDialog from "~/components/Reports/BudgetSettingsDialog.vue";
import ReportsInsightsKPIs from "~/components/Reports/ReportsInsightsKPIs.vue";

definePageMeta({
  layout: "dashboard",
});

const dashboardStore = useDashboardStore();
const { currentBankAccount } = storeToRefs(dashboardStore);

const {
  report,
  budget,
  categories,
  selectedMonths,
  selectedCategoryId,
  isLoading,
  isRebuilding,
  availableMonths,
  effectiveMonths,
  overviewChartData,
  balanceTrendData,
  monthlyComparison,
  categoryDrillDown,
  budgetProgressPerMonth,
  enhancedInsights,
  categoryList,
  handleSelectPreset,
  handleSelectYear,
  loadData,
  handleRebuildReport,
  handleSaveBudget,
} = useReportsAnalytics();

const budgetDialogOpen = ref(false);

const handleUpdateMonths = (months: string[]) => {
  selectedMonths.value = months;
};

const handleSelectCategory = (id: string | null) => {
  selectedCategoryId.value = id;
};

const handleOpenBudgetSettings = () => {
  budgetDialogOpen.value = true;
};

const handleCloseBudgetSettings = () => {
  budgetDialogOpen.value = false;
};

watch(
  () => currentBankAccount.value?.id,
  () => {
    loadData();
  },
);

onMounted(() => {
  loadData();
});
</script>

<template>
  <DashboardSection
    title="Relatórios"
    subtitle="Análise detalhada das suas finanças"
    :loading="isLoading && !report"
  >
    <template #actions>
      <UiButton
        variant="outline"
        size="sm"
        :disabled="isRebuilding"
        @click="handleRebuildReport"
      >
        <RefreshCwIcon
          class="h-4 w-4 mr-1"
          :class="{ 'animate-spin': isRebuilding }"
        />
        Recalcular
      </UiButton>
    </template>

    <template #filters>
      <ReportsPeriodSelector
        :selected-months="selectedMonths"
        :available-months="availableMonths"
        :on-select-preset="handleSelectPreset"
        :on-select-year="handleSelectYear"
        :on-update-months="handleUpdateMonths"
      />
    </template>

    <div class="space-y-6">
      <ReportsOverviewCharts
        :chart-data="overviewChartData"
        :balance-trend-data="balanceTrendData"
        :loading="isLoading"
      />

      <ReportsMonthlyComparison
        v-if="monthlyComparison && effectiveMonths.length >= 2"
        :comparison="monthlyComparison"
        :selected-months="effectiveMonths"
        :loading="isLoading"
      />

      <ReportsCategoryDrillDown
        :category-list="categoryList"
        :drill-down-data="categoryDrillDown"
        :selected-category-id="selectedCategoryId"
        :on-select-category="handleSelectCategory"
        :loading="isLoading"
      />

      <ReportsBudgetTracking
        :budget-progress-per-month="budgetProgressPerMonth"
        :loading="isLoading"
        :on-open-settings="handleOpenBudgetSettings"
      />

      <ReportsInsightsKPIs :insights="enhancedInsights" :loading="isLoading" />
    </div>

    <BudgetSettingsDialog
      :open="budgetDialogOpen"
      :budget="budget"
      :categories="categories"
      :on-close="handleCloseBudgetSettings"
      :on-save="handleSaveBudget"
    />
  </DashboardSection>
</template>
