import type { IMonthlyEntry } from "~/@schemas/models/report";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
};

export type ISavingsRatePoint = {
  label: string;
  // Fraction between 0 and 1 (or negative when expenses exceed income).
  // LineChart formats it as a percentage via formatValue.
  savingsRate: number;
  income: number;
  expenses: number;
};

// Savings rate for a month = (income - expenses) / income.
// When income is 0, rate is 0 (there's nothing to save a share of).
export const calculateSavingsRateTrend = ({
  monthKeys,
  monthlyBreakdown,
}: IProps): ISavingsRatePoint[] => {
  const sorted = [...monthKeys].sort();

  return sorted.map((key) => {
    const entry = monthlyBreakdown[key];
    const income = entry?.income ?? 0;
    const expenses = entry?.expenses ?? 0;
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
