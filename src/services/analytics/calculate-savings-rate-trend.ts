import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { splitPositiveExpenses } from "./split-positive-expenses";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  // Needed so positive-expense categories (investments, savings, etc.) can be
  // excluded from the `expenses` side of the rate. Counting investments as
  // spending suppresses the very metric the user is trying to improve.
  categories: ICategory[];
};

export type ISavingsRatePoint = {
  label: string;
  // Fraction between 0 and 1 (or negative when expenses exceed income).
  // LineChart formats it as a percentage via formatValue.
  savingsRate: number;
  income: number;
  // "Real" expenses used to compute savingsRate — excludes positive-expense
  // categories. The raw value is intentionally not carried here since this
  // point type is purely for the trend chart.
  expenses: number;
};

// Savings rate for a month = (income - realExpenses) / income.
// When income is 0, rate is 0 (there's nothing to save a share of).
export const calculateSavingsRateTrend = ({
  monthKeys,
  monthlyBreakdown,
  categories,
}: IProps): ISavingsRatePoint[] => {
  const sorted = [...monthKeys].sort();

  return sorted.map((key) => {
    const entry = monthlyBreakdown[key];
    const income = entry?.income ?? 0;
    const expenses = entry
      ? splitPositiveExpenses({ entry, categories }).realExpenses
      : 0;
    const [year, month] = key.split("-");

    const savingsRate = income > 0 ? (income - expenses) / income : 0;

    return {
      label: `${month}/${year}`,
      savingsRate,
      income,
      expenses,
    };
  });
};
