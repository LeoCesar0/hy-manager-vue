import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { splitPositiveExpenses } from "./split-positive-expenses";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  // Needed to exclude positive-expense categories from the ratio — the
  // "Proporção Saídas/Entradas" chart is about how much of the income was
  // actually spent, and counting investments as spending distorts it.
  categories: ICategory[];
};

export type IBalanceTrendPoint = {
  label: string;
  // income − rawExpenses. Stays raw because "balance" tracks money that left
  // the operating account; investments still left it. This matches the
  // "Saldo (ano)" KPI which is also raw.
  balance: number;
  // realExpenses / income. Fraction between 0 and 1 (or > 1 if overspending).
  // LineChart formats it as a percentage via formatValue.
  ratio: number;
};

export const calculateBalanceTrend = ({
  monthKeys,
  monthlyBreakdown,
  categories,
}: IProps): IBalanceTrendPoint[] => {
  const sorted = [...monthKeys].sort();

  return sorted.map((key) => {
    const entry = monthlyBreakdown[key];
    const income = entry?.income ?? 0;
    const rawExpenses = entry?.expenses ?? 0;
    const realExpenses = entry
      ? splitPositiveExpenses({ entry, categories }).realExpenses
      : 0;
    const [year, month] = key.split("-");

    return {
      label: `${month}/${year}`,
      balance: income - rawExpenses,
      ratio: income > 0 ? realExpenses / income : 0,
    };
  });
};
