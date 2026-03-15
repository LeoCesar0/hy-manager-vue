import type { IReport, IMonthlyEntry } from "~/@schemas/models/report";
import type { IBudget } from "~/@schemas/models/budget";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { getOrCreateReport } from "~/services/api/reports/get-or-create-report";
import { rebuildReport } from "~/services/api/reports/rebuild-report";
import { getOrCreateBudget } from "~/services/api/budgets/get-or-create-budget";
import { updateBudget } from "~/services/api/budgets/update-budget";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { compareMonths, type IMonthlyComparison } from "~/services/analytics/compare-months";
import { calculateBudgetProgress, type IBudgetProgress } from "~/services/analytics/calculate-budget-progress";
import { calculateReportInsights, type IReportInsights } from "~/services/analytics/calculate-report-insights";

const getDefaultMonths = (count: number): string[] => {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
};

export const useReportsAnalytics = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);
  const dashboardStore = useDashboardStore();
  const { currentBankAccount } = storeToRefs(dashboardStore);

  const report = ref<IReport | null>(null);
  const budget = ref<IBudget | null>(null);
  const categories = ref<ICategory[]>([]);
  const counterparties = ref<ICounterparty[]>([]);
  const selectedMonths = ref<string[]>(getDefaultMonths(3));
  const selectedCategoryId = ref<string | null>(null);
  const isLoading = ref(false);
  const isRebuilding = ref(false);

  const availableMonths = computed(() => {
    if (!report.value) return [];
    return Object.keys(report.value.monthlyBreakdown).sort();
  });

  const selectedMonthData = computed<Record<string, IMonthlyEntry>>(() => {
    if (!report.value) return {};
    const result: Record<string, IMonthlyEntry> = {};
    for (const key of selectedMonths.value) {
      const entry = report.value.monthlyBreakdown[key];
      if (entry) {
        result[key] = entry;
      }
    }
    return result;
  });

  const overviewChartData = computed(() => {
    const sorted = [...selectedMonths.value].sort();
    return sorted.map((key) => {
      const entry = report.value?.monthlyBreakdown[key];
      const [year, month] = key.split("-");
      return {
        label: `${month}/${year}`,
        income: entry?.income ?? 0,
        expenses: entry?.expenses ?? 0,
        balance: (entry?.income ?? 0) - (entry?.expenses ?? 0),
      };
    });
  });

  const balanceTrendData = computed(() => {
    return overviewChartData.value.map((item) => ({
      label: item.label,
      balance: item.balance,
      ratio: item.income > 0 ? item.expenses / item.income : 0,
    }));
  });

  const monthlyComparison = computed<IMonthlyComparison | null>(() => {
    if (!report.value || selectedMonths.value.length < 2) return null;
    return compareMonths({
      monthKeys: selectedMonths.value,
      monthlyBreakdown: report.value.monthlyBreakdown,
      categories: categories.value,
      counterparties: counterparties.value,
    });
  });

  const categoryDrillDown = computed(() => {
    if (!report.value || !selectedCategoryId.value) return null;
    const sorted = [...selectedMonths.value].sort();
    const catId = selectedCategoryId.value;
    const cat = categories.value.find((c) => c.id === catId);

    const monthlyData = sorted.map((key) => {
      const entry = report.value?.monthlyBreakdown[key];
      const [year, month] = key.split("-");
      const expenseAmount = entry?.expensesByCategory?.[catId] ?? 0;
      const depositAmount = entry?.depositsByCategory?.[catId] ?? 0;
      return {
        label: `${month}/${year}`,
        expenses: expenseAmount,
        deposits: depositAmount,
        total: expenseAmount + depositAmount,
      };
    });

    const totalExpense = report.value?.expensesByCategory[catId] ?? 0;
    const totalDeposit = report.value?.depositsByCategory[catId] ?? 0;
    const totalAllExpenses = report.value?.totalExpenses ?? 0;
    const totalAllDeposits = report.value?.totalIncome ?? 0;

    const percentOfExpenses = totalAllExpenses > 0 ? (totalExpense / totalAllExpenses) * 100 : 0;
    const percentOfDeposits = totalAllDeposits > 0 ? (totalDeposit / totalAllDeposits) * 0 : 0;

    return {
      category: cat,
      monthlyData,
      totalExpense,
      totalDeposit,
      percentOfExpenses,
      percentOfDeposits,
    };
  });

  const currentMonthKey = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const budgetProgress = computed<IBudgetProgress | null>(() => {
    if (!budget.value || !report.value) return null;

    const monthData = report.value.monthlyBreakdown[currentMonthKey.value] ?? {
      income: 0,
      expenses: 0,
      expensesByCategory: {},
      depositsByCategory: {},
      expensesByCounterparty: {},
      depositsByCounterparty: {},
    };

    return calculateBudgetProgress({
      budget: budget.value,
      monthData,
      categories: categories.value,
    });
  });

  const enhancedInsights = computed<IReportInsights | null>(() => {
    if (!report.value) return null;
    return calculateReportInsights({
      report: report.value,
      selectedMonths: selectedMonths.value,
      categories: categories.value,
    });
  });

  const categoryList = computed(() => {
    if (!report.value) return [];
    const sorted = [...selectedMonths.value].sort();
    const categoryTotals = new Map<string, number>();

    for (const key of sorted) {
      const entry = report.value.monthlyBreakdown[key];
      if (!entry) continue;
      for (const [catId, amount] of Object.entries(entry.expensesByCategory ?? {})) {
        categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + amount);
      }
      for (const [catId, amount] of Object.entries(entry.depositsByCategory ?? {})) {
        categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + amount);
      }
    }

    return [...categoryTotals.entries()]
      .map(([id, total]) => {
        const cat = categories.value.find((c) => c.id === id);
        return { id, name: cat?.name ?? "Desconhecido", total, color: cat?.color ?? null };
      })
      .sort((a, b) => b.total - a.total);
  });

  const handleSelectPreset = (months: number) => {
    selectedMonths.value = getDefaultMonths(months);
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

  const loadData = async () => {
    if (!currentUser.value || !currentBankAccount.value) return;
    isLoading.value = true;
    try {
      const [categoriesRes, counterpartiesRes, reportRes, budgetRes] = await Promise.all([
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
        getOrCreateBudget({
          userId: currentUser.value.id,
          bankAccountId: currentBankAccount.value.id,
          options: { toastOptions: undefined },
        }),
      ]);

      if (categoriesRes.data) categories.value = categoriesRes.data;
      if (counterpartiesRes.data) counterparties.value = counterpartiesRes.data;
      if (reportRes.data) report.value = reportRes.data;
      if (budgetRes.data) budget.value = budgetRes.data;
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

  const handleSaveBudget = async (data: Partial<import("~/@schemas/models/budget").IBudgetBase>) => {
    if (!currentBankAccount.value) return;
    const result = await updateBudget({
      bankAccountId: currentBankAccount.value.id,
      data,
    });
    if (result?.data) {
      budget.value = result.data;
    }
  };

  return {
    report,
    budget,
    categories,
    counterparties,
    selectedMonths,
    selectedCategoryId,
    isLoading,
    isRebuilding,
    availableMonths,
    selectedMonthData,
    overviewChartData,
    balanceTrendData,
    monthlyComparison,
    categoryDrillDown,
    budgetProgress,
    enhancedInsights,
    categoryList,
    currentMonthKey,
    handleSelectPreset,
    handleSelectYear,
    loadData,
    handleRebuildReport,
    handleSaveBudget,
  };
};
