<script setup lang="ts">
import type { IReport } from "~/@schemas/models/report";
import { getOrCreateReport } from "~/services/api/reports/get-or-create-report";
import { buildCategoryDrillDown } from "~/services/analytics/build-category-drill-down";
import { getDefaultMonths } from "~/helpers/get-default-months";
import ReportsPeriodSelector from "~/components/Reports/ReportsPeriodSelector.vue";
import MonthlyTrendBarChart from "~/components/Charts/MonthlyTrendBarChart.vue";

type IProps = {
  categoryId: string;
};

const props = defineProps<IProps>();

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const dashboardStore = useDashboardStore();
const { currentBankAccount } = storeToRefs(dashboardStore);
const referenceDataStore = useReferenceDataStore();
const { categories } = storeToRefs(referenceDataStore);

const report = ref<IReport | null>(null);
const isLoading = ref(false);
// Default window for this view is the last 6 months. effectiveMonths then
// narrows it to the months the report actually has data for.
const selectedMonths = ref<string[]>(getDefaultMonths({ count: 6 }));

const availableMonths = computed(() => {
  if (!report.value) return [];
  return Object.keys(report.value.monthlyBreakdown).sort();
});

const effectiveMonths = computed(() => {
  const available = new Set(availableMonths.value);
  return [...selectedMonths.value].filter((m) => available.has(m)).sort();
});

const drillDown = computed(() => {
  if (!report.value) return null;
  return buildCategoryDrillDown({
    report: report.value,
    categories: categories.value,
    selectedCategoryId: props.categoryId,
    monthKeys: effectiveMonths.value,
  });
});

const loadReport = async () => {
  if (!currentUser.value || !currentBankAccount.value) return;
  isLoading.value = true;
  try {
    const [reportRes] = await Promise.all([
      getOrCreateReport({
        userId: currentUser.value.id,
        bankAccountId: currentBankAccount.value.id,
        options: { toastOptions: undefined },
      }),
      referenceDataStore.load({ userId: currentUser.value.id }),
    ]);
    if (reportRes.data) report.value = reportRes.data;
  } finally {
    isLoading.value = false;
  }
};

const handleSelectPreset = (months: number) => {
  selectedMonths.value = getDefaultMonths({ count: months });
};

const handleSelectYear = (year: number) => {
  const months: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    if (report.value?.monthlyBreakdown[key]) {
      months.push(key);
    }
  }
  if (months.length > 0) {
    selectedMonths.value = months;
  }
};

const handleUpdateMonths = (months: string[]) => {
  selectedMonths.value = months;
};

// Report aggregates are per bank account, so reload when the active account
// changes — mirrors the Relatórios page behavior.
watch(
  () => currentBankAccount.value?.id,
  () => {
    loadReport();
  },
);

onMounted(() => {
  loadReport();
});
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-lg font-semibold">Evolução no tempo</h3>
      <p class="text-sm text-muted-foreground">
        Movimentação desta categoria mês a mês na conta selecionada
      </p>
    </div>

    <ReportsPeriodSelector
      :selected-months="selectedMonths"
      :available-months="availableMonths"
      :on-select-preset="handleSelectPreset"
      :on-select-year="handleSelectYear"
      :on-update-months="handleUpdateMonths"
    />

    <MonthlyTrendBarChart
      :data="drillDown?.monthlyData ?? []"
      :loading="isLoading"
    />
  </div>
</template>
