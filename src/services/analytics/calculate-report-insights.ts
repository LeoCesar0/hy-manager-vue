import type { IReport, IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { roundCurrency } from "~/helpers/roundCurrency";

type IProps = {
  report: IReport;
  selectedMonths: string[];
  categories: ICategory[];
};

export type IReportInsights = {
  savingsRate: number | null;
  biggestIncrease: { name: string; change: number; changePercent: number } | null;
  biggestDecrease: { name: string; change: number; changePercent: number } | null;
  ytdIncome: number;
  ytdExpenses: number;
  ytdBalance: number;
  averageMonthlySpending: number;
};

export const calculateReportInsights = ({
  report,
  selectedMonths,
  categories,
}: IProps): IReportInsights => {
  const sorted = [...selectedMonths].sort();
  const monthlyBreakdown = report.monthlyBreakdown;

  const totalIncome = sorted.reduce((sum, key) => sum + (monthlyBreakdown[key]?.income ?? 0), 0);
  const totalExpenses = sorted.reduce((sum, key) => sum + (monthlyBreakdown[key]?.expenses ?? 0), 0);

  const savingsRate = totalIncome > 0
    ? roundCurrency({ value: ((totalIncome - totalExpenses) / totalIncome) * 100 })
    : null;

  let biggestIncrease: IReportInsights["biggestIncrease"] = null;
  let biggestDecrease: IReportInsights["biggestDecrease"] = null;

  if (sorted.length >= 2) {
    const firstKey = sorted[0]!;
    const lastKey = sorted[sorted.length - 1]!;
    const firstEntry = monthlyBreakdown[firstKey];
    const lastEntry = monthlyBreakdown[lastKey];

    if (firstEntry && lastEntry) {
      const allCategoryIds = new Set<string>();
      Object.keys(firstEntry.expensesByCategory ?? {}).forEach((id) => allCategoryIds.add(id));
      Object.keys(lastEntry.expensesByCategory ?? {}).forEach((id) => allCategoryIds.add(id));

      for (const id of allCategoryIds) {
        const firstAmount = firstEntry.expensesByCategory?.[id] ?? 0;
        const lastAmount = lastEntry.expensesByCategory?.[id] ?? 0;
        const change = lastAmount - firstAmount;

        if (firstAmount === 0 && lastAmount === 0) continue;

        const changePercent = firstAmount > 0 ? (change / firstAmount) * 100 : 100;
        const cat = categories.find((c) => c.id === id);
        const name = cat?.name ?? "Desconhecido";

        if (change > 0 && (!biggestIncrease || change > biggestIncrease.change)) {
          biggestIncrease = { name, change, changePercent };
        }

        if (change < 0 && (!biggestDecrease || change < biggestDecrease.change)) {
          biggestDecrease = { name, change, changePercent };
        }
      }
    }
  }

  const currentYear = new Date().getFullYear().toString();
  const ytdMonths = Object.entries(monthlyBreakdown).filter(([key]) =>
    key.startsWith(currentYear)
  );

  const ytdIncome = ytdMonths.reduce((sum, [, m]) => sum + m.income, 0);
  const ytdExpenses = ytdMonths.reduce((sum, [, m]) => sum + m.expenses, 0);
  const ytdBalance = roundCurrency({ value: ytdIncome - ytdExpenses });

  const allMonthEntries = Object.values(monthlyBreakdown);
  const averageMonthlySpending =
    allMonthEntries.length > 0
      ? roundCurrency({
          value: allMonthEntries.reduce((sum, m) => sum + m.expenses, 0) / allMonthEntries.length,
        })
      : 0;

  return {
    savingsRate,
    biggestIncrease,
    biggestDecrease,
    ytdIncome: roundCurrency({ value: ytdIncome }),
    ytdExpenses: roundCurrency({ value: ytdExpenses }),
    ytdBalance,
    averageMonthlySpending,
  };
};
