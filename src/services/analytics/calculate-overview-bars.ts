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
  // When false (default), investments are folded into realExpenses and
  // positiveExpenses is zeroed out — the bar chart shows one combined
  // expense bar per month. When true, the split is preserved and the chart
  // renders Saídas reais + Investimentos as distinct series.
  includePositiveExpenses?: boolean;
};

// Bar-chart-ready per-month series that separates real expenses from
// positive-expense categories (Investimentos, Poupança). The Relatórios bar
// chart uses this instead of the raw `entry.expenses` field so saving doesn't
// get visually conflated with spending.
export const calculateOverviewBars = ({
  monthKeys,
  monthlyBreakdown,
  categories,
  includePositiveExpenses = false,
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
    // Balance uses RAW expenses (including investments) — balance is still
    // "money that left the account", so investments count. The split is
    // for visualization only.
    const balance = income - split.rawExpenses;

    if (!includePositiveExpenses) {
      // Fold investments into the combined expense bar so the total outflow
      // is preserved visually. Without folding, toggling off would make the
      // balance "improve" even though no real change occurred.
      return {
        label,
        income,
        realExpenses: split.rawExpenses,
        positiveExpenses: 0,
        balance,
      };
    }

    return {
      label,
      income,
      realExpenses: split.realExpenses,
      positiveExpenses: split.positiveExpenses,
      balance,
    };
  });
};
