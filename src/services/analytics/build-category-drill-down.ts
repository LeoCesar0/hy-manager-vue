import type { IReport } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";

type IProps = {
  report: IReport;
  categories: ICategory[];
  selectedCategoryId: string;
  monthKeys: string[];
};

// Shared drill-down shape — reused by buildCounterpartyDrillDown so the UI
// component can render either without branching on the item kind.
export type IItemDrillDown = {
  item: { id: string; name: string; color?: string | null } | undefined;
  monthlyData: {
    label: string;
    expenses: number;
    deposits: number;
    total: number;
  }[];
  totalExpense: number;
  totalDeposit: number;
  percentOfExpenses: number;
  percentOfDeposits: number;
};

export const buildCategoryDrillDown = ({
  report,
  categories,
  selectedCategoryId,
  monthKeys,
}: IProps): IItemDrillDown => {
  const sorted = [...monthKeys].sort();
  const cat = categories.find((c) => c.id === selectedCategoryId);

  const monthlyData = sorted.map((key) => {
    const entry = report.monthlyBreakdown[key];
    const [year, month] = key.split("-");
    const expenseAmount = entry?.expensesByCategory?.[selectedCategoryId] ?? 0;
    const depositAmount = entry?.depositsByCategory?.[selectedCategoryId] ?? 0;
    return {
      label: `${month}/${year}`,
      expenses: expenseAmount,
      deposits: depositAmount,
      total: expenseAmount + depositAmount,
    };
  });

  const totalExpense = report.expensesByCategory[selectedCategoryId] ?? 0;
  const totalDeposit = report.depositsByCategory[selectedCategoryId] ?? 0;
  const totalAllExpenses = report.totalExpenses ?? 0;
  const totalAllDeposits = report.totalIncome ?? 0;

  const percentOfExpenses =
    totalAllExpenses > 0 ? (totalExpense / totalAllExpenses) * 100 : 0;
  const percentOfDeposits =
    totalAllDeposits > 0 ? (totalDeposit / totalAllDeposits) * 100 : 0;

  return {
    item: cat
      ? { id: cat.id, name: cat.name, color: cat.color }
      : undefined,
    monthlyData,
    totalExpense,
    totalDeposit,
    percentOfExpenses,
    percentOfDeposits,
  };
};
