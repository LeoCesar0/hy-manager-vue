import { Timestamp } from "firebase/firestore";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IReport } from "~/@schemas/models/report";
import { getTransactions } from "~/services/api/transactions/get-transactions";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { getOrCreateReport } from "~/services/api/reports/get-or-create-report";
import { rebuildReport } from "~/services/api/reports/rebuild-report";
import { calculateTotals } from "~/services/analytics/calculate-totals";
import { groupByCategory } from "~/services/analytics/group-by-category";
import { groupByCounterparty } from "~/services/analytics/group-by-counterparty";
import { filterByType } from "~/services/analytics/filter-by-type";
import { calculateInsights } from "~/services/analytics/calculate-insights";
import type { IInsights } from "~/services/analytics/calculate-insights";
import type { FirebaseFilterFor } from "~/services/firebase/@type";

export type PeriodKey = "1w" | "2w" | "1m" | "2m" | "6m" | "custom";

export type IPeriodOption = {
  key: PeriodKey;
  label: string;
};

export const PERIOD_OPTIONS: IPeriodOption[] = [
  { key: "1w", label: "1 sem" },
  { key: "2w", label: "2 sem" },
  { key: "1m", label: "1 mês" },
  { key: "2m", label: "2 meses" },
  { key: "6m", label: "6 meses" },
  { key: "custom", label: "Personalizado" },
];

const DEFAULT_PERIOD: PeriodKey = "2m";

const computePeriodDates = (key: PeriodKey): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const startDate = new Date(now);

  switch (key) {
    case "1w":
      startDate.setDate(now.getDate() - 7);
      break;
    case "2w":
      startDate.setDate(now.getDate() - 14);
      break;
    case "1m":
      startDate.setMonth(now.getMonth() - 1, 1);
      break;
    case "2m":
      startDate.setMonth(now.getMonth() - 2, 1);
      break;
    case "6m":
      startDate.setMonth(now.getMonth() - 6, 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 2, 1);
  }

  return { startDate, endDate: now };
};

export const useDashboardAnalytics = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);
  const dashboardStore = useDashboardStore();
  const { currentBankAccount } = storeToRefs(dashboardStore);

  const filteredTransactions = ref<ITransaction[]>([]);
  const categories = ref<ICategory[]>([]);
  const counterparties = ref<ICounterparty[]>([]);
  const report = ref<IReport | null>(null);
  const isLoading = ref(false);
  const isRebuilding = ref(false);

  const selectedPeriod = ref<PeriodKey>(DEFAULT_PERIOD);

  const { startDate: initialStart, endDate: initialEnd } = computePeriodDates(DEFAULT_PERIOD);

  const filters = ref<{ startDate: Timestamp | null; endDate: Timestamp | null }>({
    startDate: Timestamp.fromDate(initialStart),
    endDate: Timestamp.fromDate(initialEnd),
  });

  const handleSelectPeriod = (key: PeriodKey) => {
    selectedPeriod.value = key;
    if (key === "custom") return;
    const { startDate, endDate } = computePeriodDates(key);
    filters.value.startDate = Timestamp.fromDate(startDate);
    filters.value.endDate = Timestamp.fromDate(endDate);
  };

  const totals = computed(() => calculateTotals(filteredTransactions.value));

  const filteredExpenses = computed(() =>
    filterByType({ transactions: filteredTransactions.value, type: "expense" })
  );
  const filteredDeposits = computed(() =>
    filterByType({ transactions: filteredTransactions.value, type: "deposit" })
  );

  const expensesByCategory = computed(() =>
    groupByCategory(filteredExpenses.value, categories.value)
  );
  const depositsByCategory = computed(() =>
    groupByCategory(filteredDeposits.value, categories.value)
  );
  const expensesByCounterparty = computed(() =>
    groupByCounterparty(filteredExpenses.value, counterparties.value)
  );
  const depositsByCounterparty = computed(() =>
    groupByCounterparty(filteredDeposits.value, counterparties.value)
  );

  const insights = computed<IInsights>(() =>
    calculateInsights({
      filteredTransactions: filteredTransactions.value,
      report: report.value,
      categories: categories.value,
      counterparties: counterparties.value,
    })
  );

  const buildDateFilters = (): FirebaseFilterFor<ITransaction>[] => {
    const dateFilters: FirebaseFilterFor<ITransaction>[] = [];

    if (filters.value.startDate) {
      dateFilters.push({
        field: "date",
        operator: ">=",
        value: filters.value.startDate,
      });
    }

    if (filters.value.endDate) {
      const endOfDay = new Date(filters.value.endDate.toDate());
      endOfDay.setHours(23, 59, 59, 999);
      dateFilters.push({
        field: "date",
        operator: "<=",
        value: Timestamp.fromDate(endOfDay),
      });
    }

    return dateFilters;
  };

  const fetchFilteredTransactions = async () => {
    if (!currentUser.value || !currentBankAccount.value) return;

    const dateFilters = buildDateFilters();
    const transactionsRes = await getTransactions({
      userId: currentUser.value.id,
      bankAccountId: currentBankAccount.value.id,
      filters: dateFilters,
      options: { toastOptions: undefined },
    });

    if (transactionsRes.data) {
      filteredTransactions.value = transactionsRes.data;
    }
  };

  const loadData = async () => {
    if (!currentUser.value || !currentBankAccount.value) return;
    isLoading.value = true;
    try {
      const [transactionsRes, categoriesRes, counterpartiesRes, reportRes] = await Promise.all([
        getTransactions({
          userId: currentUser.value.id,
          bankAccountId: currentBankAccount.value.id,
          filters: buildDateFilters(),
          options: { toastOptions: undefined },
        }),
        getCategories({
          userId: currentUser.value.id,
          options: { toastOptions: undefined },
        }),
        getCounterparties({
          userId: currentUser.value.id,
          options: { toastOptions: undefined },
        }),
        getOrCreateReport({
          userId: currentUser.value.id,
          bankAccountId: currentBankAccount.value.id,
          options: { toastOptions: undefined },
        }),
      ]);

      console.log('❗ loadData reportRes -->', reportRes);

      if (transactionsRes.data) {
        filteredTransactions.value = transactionsRes.data;
      }
      if (categoriesRes.data) {
        categories.value = categoriesRes.data;
      }
      if (counterpartiesRes.data) {
        counterparties.value = counterpartiesRes.data;
      }
      if (reportRes.data) {
        report.value = reportRes.data;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const handleRebuildReport = async () => {
    if (!currentUser.value || !currentBankAccount.value) return;
    isRebuilding.value = true;
    try {
      const result = await rebuildReport({
        userId: currentUser.value.id,
        bankAccountId: currentBankAccount.value.id,
        options: {
          toastOptions: {
            loading: { message: "Recalculando relatório..." },
            success: { message: "Relatório recalculado com sucesso!" },
            error: true,
          },
        },
      });

      if (result?.data) {
        report.value = result.data;
      }
    } finally {
      isRebuilding.value = false;
    }
  };

  const clearFilters = () => {
    handleSelectPeriod(DEFAULT_PERIOD);
  };

  watch(
    filters,
    () => {
      fetchFilteredTransactions();
    },
    { deep: true }
  );

  return {
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
  };
};
