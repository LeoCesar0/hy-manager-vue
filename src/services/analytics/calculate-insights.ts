import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { groupByCategory } from "./group-by-category";
import { groupByCounterparty } from "./group-by-counterparty";
import { calculateTotals } from "./calculate-totals";
import { groupByDate } from "./group-by-date";
import { filterByType } from "./filter-by-type";

type InsightItem = {
  name: string;
  amount: number;
} | null;

type IProps = {
  filteredTransactions: ITransaction[];
  allTransactions: ITransaction[];
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

export const calculateInsights = ({
  filteredTransactions,
  allTransactions,
  categories,
  counterparties,
}: IProps): IInsights => {
  const filteredExpenses = filterByType({ transactions: filteredTransactions, type: "expense" });
  const filteredDeposits = filterByType({ transactions: filteredTransactions, type: "deposit" });
  const allExpenses = filterByType({ transactions: allTransactions, type: "expense" });
  const allDeposits = filterByType({ transactions: allTransactions, type: "deposit" });

  const getTop = (items: { name: string; amount: number }[]): InsightItem => {
    return items.length > 0 ? { name: items[0]!.name, amount: items[0]!.amount } : null;
  };

  const topExpenseCategory = getTop(groupByCategory(filteredExpenses, categories));
  const topDepositCategory = getTop(groupByCategory(filteredDeposits, categories));
  const topExpenseCategoryAllTime = getTop(groupByCategory(allExpenses, categories));
  const topDepositCategoryAllTime = getTop(groupByCategory(allDeposits, categories));

  const topExpenseCounterparty = getTop(groupByCounterparty(filteredExpenses, counterparties));
  const topDepositCounterparty = getTop(groupByCounterparty(filteredDeposits, counterparties));
  const topExpenseCounterpartyAllTime = getTop(groupByCounterparty(allExpenses, counterparties));
  const topDepositCounterpartyAllTime = getTop(groupByCounterparty(allDeposits, counterparties));

  const monthlyData = groupByDate(allExpenses, "monthly");
  const averageMonthlySpending =
    monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length
      : 0;

  const filteredTotals = calculateTotals(filteredTransactions);
  const expenseToIncomeRatio =
    filteredTotals.income > 0 ? filteredTotals.expenses / filteredTotals.income : 0;

  let monthOverMonthChange: number | null = null;
  if (monthlyData.length >= 2) {
    const current = monthlyData[monthlyData.length - 1]!.expenses;
    const previous = monthlyData[monthlyData.length - 2]!.expenses;
    if (previous > 0) {
      monthOverMonthChange = ((current - previous) / previous) * 100;
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
