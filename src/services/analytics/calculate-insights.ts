import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IReport } from "~/@schemas/models/report";
import { groupByCategory } from "./group-by-category";
import { groupByCounterparty } from "./group-by-counterparty";
import { calculateTotals } from "./calculate-totals";
import { filterByType } from "./filter-by-type";

type InsightItem = {
  name: string;
  amount: number;
} | null;

type IProps = {
  filteredTransactions: ITransaction[];
  report: IReport | null;
  categories: ICategory[];
  counterparties: ICounterparty[];
};

export type IInsights = {
  topExpenseCategory: InsightItem;
  topDepositCategory: InsightItem;
  topExpenseCategoryAllTime: InsightItem;
  topDepositCategoryAllTime: InsightItem;
  topExpenseCounterparty: InsightItem;
  topDepositCounterparty: InsightItem;
  topExpenseCounterpartyAllTime: InsightItem;
  topDepositCounterpartyAllTime: InsightItem;
  averageMonthlySpending: number;
  expenseToIncomeRatio: number;
  monthOverMonthChange: number | null;
};

const SYNTHETIC_IDS = new Set(["uncategorized", "no-counterparty"]);

const getTop = (items: { id: string; name: string; amount: number }[]): InsightItem => {
  const filtered = items.filter((item) => !SYNTHETIC_IDS.has(item.id));
  return filtered.length > 0 ? { name: filtered[0]!.name, amount: filtered[0]!.amount } : null;
};

const getTopFromMap = ({
  map,
  lookup,
}: {
  map: Record<string, number>;
  lookup: { id: string; name: string }[];
}): InsightItem => {
  const entries = Object.entries(map).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return null;

  const [id, amount] = entries[0]!;
  const item = lookup.find((l) => l.id === id);
  return { name: item?.name ?? "Desconhecido", amount };
};

export const calculateInsights = ({
  filteredTransactions,
  report,
  categories,
  counterparties,
}: IProps): IInsights => {
  const filteredExpenses = filterByType({ transactions: filteredTransactions, type: "expense" });
  const filteredDeposits = filterByType({ transactions: filteredTransactions, type: "deposit" });

  const topExpenseCategory = getTop(groupByCategory(filteredExpenses, categories));
  const topDepositCategory = getTop(groupByCategory(filteredDeposits, categories));
  const topExpenseCounterparty = getTop(groupByCounterparty(filteredExpenses, counterparties));
  const topDepositCounterparty = getTop(groupByCounterparty(filteredDeposits, counterparties));

  const filteredTotals = calculateTotals(filteredTransactions);
  const expenseToIncomeRatio =
    filteredTotals.income > 0 ? filteredTotals.expenses / filteredTotals.income : 0;

  let topExpenseCategoryAllTime: InsightItem = null;
  let topDepositCategoryAllTime: InsightItem = null;
  let topExpenseCounterpartyAllTime: InsightItem = null;
  let topDepositCounterpartyAllTime: InsightItem = null;
  let averageMonthlySpending = 0;
  let monthOverMonthChange: number | null = null;

  if (report) {
    topExpenseCategoryAllTime = getTopFromMap({ map: report.expensesByCategory, lookup: categories });
    topDepositCategoryAllTime = getTopFromMap({ map: report.depositsByCategory, lookup: categories });
    topExpenseCounterpartyAllTime = getTopFromMap({ map: report.expensesByCounterparty, lookup: counterparties });
    topDepositCounterpartyAllTime = getTopFromMap({ map: report.depositsByCounterparty, lookup: counterparties });

    const monthlyEntries = Object.entries(report.monthlyBreakdown).sort(([a], [b]) => a.localeCompare(b));

    if (monthlyEntries.length > 0) {
      const totalExpenses = monthlyEntries.reduce((sum, [, m]) => sum + m.expenses, 0);
      averageMonthlySpending = totalExpenses / monthlyEntries.length;
    }

    if (monthlyEntries.length >= 2) {
      const current = monthlyEntries[monthlyEntries.length - 1]![1].expenses;
      const previous = monthlyEntries[monthlyEntries.length - 2]![1].expenses;
      if (previous > 0) {
        monthOverMonthChange = ((current - previous) / previous) * 100;
      }
    }
  }

  return {
    topExpenseCategory,
    topDepositCategory,
    topExpenseCategoryAllTime,
    topDepositCategoryAllTime,
    topExpenseCounterparty,
    topDepositCounterparty,
    topExpenseCounterpartyAllTime,
    topDepositCounterpartyAllTime,
    averageMonthlySpending,
    expenseToIncomeRatio,
    monthOverMonthChange,
  };
};
