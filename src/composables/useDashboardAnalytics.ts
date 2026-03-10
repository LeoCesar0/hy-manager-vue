import { Timestamp } from "firebase/firestore";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IReport } from "~/@schemas/models/report";
import { getTransactions } from "~/services/api/transactions/get-transactions";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { getOrCreateReport } from "~/services/api/reports/get-or-create-report";
import { calculateTotals } from "~/services/analytics/calculate-totals";
import { groupByCategory } from "~/services/analytics/group-by-category";
import { groupByCounterparty } from "~/services/analytics/group-by-counterparty";
import { filterByType } from "~/services/analytics/filter-by-type";
import { calculateInsights } from "~/services/analytics/calculate-insights";
import type { IInsights } from "~/services/analytics/calculate-insights";
import type { FirebaseFilterFor } from "~/services/firebase/@type";

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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filters = ref<{ startDate: Timestamp | null; endDate: Timestamp | null }>({
    startDate: Timestamp.fromDate(startOfMonth),
    endDate: Timestamp.fromDate(now),
  });

  const totals = computed(() => calculateTotals(filteredTransactions.value));

  const expensesByCategory = computed(() => {
    const expenses = filterByType({ transactions: filteredTransactions.value, type: "expense" });
    return groupByCategory(expenses, categories.value);
  });

  const depositsByCategory = computed(() => {
    const deposits = filterByType({ transactions: filteredTransactions.value, type: "deposit" });
    return groupByCategory(deposits, categories.value);
  });

  const expensesByCounterparty = computed(() => {
    const expenses = filterByType({ transactions: filteredTransactions.value, type: "expense" });
    return groupByCounterparty(expenses, counterparties.value);
  });

  const depositsByCounterparty = computed(() => {
    const deposits = filterByType({ transactions: filteredTransactions.value, type: "deposit" });
    return groupByCounterparty(deposits, counterparties.value);
  });

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
    console.log(`------------- 🟢 START SESSION LOAD DATA -------------`);
    console.log(`❗ currentBankAccount.value.id -->`, currentBankAccount.value.id);

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

      console.log(`❗ transactionsRes -->`, transactionsRes);
      console.log(`❗ categoriesRes -->`, categoriesRes);
      console.log(`❗ counterpartiesRes -->`, counterpartiesRes);
      console.log(`❗ reportRes -->`, reportRes);

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

  const clearFilters = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.value.startDate = Timestamp.fromDate(startOfMonth);
    filters.value.endDate = Timestamp.fromDate(now);
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
  };
};
