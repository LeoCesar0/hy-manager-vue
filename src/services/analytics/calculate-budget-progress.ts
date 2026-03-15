import type { IBudget } from "~/@schemas/models/budget";
import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";

type IProps = {
  budget: IBudget;
  monthData: IMonthlyEntry;
  categories: ICategory[];
};

type IProgressItem = {
  label: string;
  current: number;
  target: number;
  percentage: number;
  isOverBudget: boolean;
  variant: "expense" | "deposit";
};

export type IBudgetProgress = {
  overallExpense: IProgressItem | null;
  overallIncome: IProgressItem | null;
  categoryItems: IProgressItem[];
};

export const calculateBudgetProgress = ({
  budget,
  monthData,
  categories,
}: IProps): IBudgetProgress => {
  let overallExpense: IProgressItem | null = null;
  let overallIncome: IProgressItem | null = null;

  if (budget.monthlyExpenseLimit !== null && budget.monthlyExpenseLimit > 0) {
    const current = monthData.expenses;
    const target = budget.monthlyExpenseLimit;
    const percentage = (current / target) * 100;

    overallExpense = {
      label: "Limite de gastos mensal",
      current,
      target,
      percentage,
      isOverBudget: current > target,
      variant: "expense",
    };
  }

  if (budget.monthlyIncomeGoal !== null && budget.monthlyIncomeGoal > 0) {
    const current = monthData.income;
    const target = budget.monthlyIncomeGoal;
    const percentage = (current / target) * 100;

    overallIncome = {
      label: "Meta de receita mensal",
      current,
      target,
      percentage,
      isOverBudget: false,
      variant: "deposit",
    };
  }

  const categoryItems: IProgressItem[] = budget.categoryBudgets.map((cb) => {
    const category = categories.find((c) => c.id === cb.categoryId);
    const isExpense = cb.type === "expense";

    const categoryMap = isExpense
      ? (monthData.expensesByCategory ?? {})
      : (monthData.depositsByCategory ?? {});

    const current = categoryMap[cb.categoryId] ?? 0;
    const target = cb.amount;
    const percentage = target > 0 ? (current / target) * 100 : 0;

    return {
      label: category?.name ?? "Categoria desconhecida",
      current,
      target,
      percentage,
      isOverBudget: isExpense && current > target,
      variant: cb.type,
    };
  });

  return { overallExpense, overallIncome, categoryItems };
};
