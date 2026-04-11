import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { splitPositiveExpenses } from "./split-positive-expenses";

export type IOverviewBarPoint = {
  label: string;
  income: number;
  realExpenses: number;
  positiveExpenses: number;
  balance: number;
};

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  categories: ICategory[];
};

// Bar-chart-ready per-month series that separates real expenses from
// positive-expense categories (Investimentos, Poupança). The Relatórios bar
// chart uses this instead of the raw `entry.expenses` field so saving doesn't
// get visually conflated with spending.
export const calculateOverviewBars = ({
  monthKeys,
  monthlyBreakdown,
  categories,
}: IProps): IOverviewBarPoint[] => {
  return monthKeys.map((key): IOverviewBarPoint => {
    const entry = monthlyBreakdown[key];
    const [year, month] = key.split("-");
    const label = `${month}/${year}`;

    if (!entry) {
      return { label, income: 0, realExpenses: 0, positiveExpenses: 0, balance: 0 };
    }

    const split = splitPositiveExpenses({ entry, categories });
    const income = entry.income;

    return {
      label,
      income,
      realExpenses: split.realExpenses,
      positiveExpenses: split.positiveExpenses,
      // Balance uses RAW expenses (including investments) — balance is still
      // "money that left the account", so investments count. The split is
      // for visualization only.
      balance: income - split.rawExpenses,
    };
  });
};
