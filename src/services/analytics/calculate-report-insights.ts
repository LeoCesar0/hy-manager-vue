import type { IReport, IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { roundCurrency } from "~/helpers/roundCurrency";

type IProps = {
  report: IReport;
  selectedMonths: string[];
  categories: ICategory[];
};

// monthKey is the "to" month of the winning adjacent pair — i.e. the month
// where the jump landed. Lets the UI pinpoint *when* the spike happened.
export type IInsightChange = {
  name: string;
  change: number;
  changePercent: number;
  monthKey: string;
};

export type IReportInsights = {
  savingsRate: number | null;
  biggestIncrease: IInsightChange | null;
  biggestDecrease: IInsightChange | null;
  ytdIncome: number;
  ytdExpenses: number;
  ytdBalance: number;
  averageMonthlySpending: number;
  averageMonthlyIncome: number;
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

  // Scan every adjacent pair of months inside the selection (Jan→Feb, Feb→Mar,
  // …) so a mid-window spike or drop is caught. The previous implementation
  // only compared sorted[0] vs sorted[last] and silently missed anything that
  // zeroed out at the endpoints. For 2-month selections this collapses to the
  // old behavior (one pair = same result).
  for (let i = 0; i < sorted.length - 1; i++) {
    const fromKey = sorted[i]!;
    const toKey = sorted[i + 1]!;
    const fromEntry = monthlyBreakdown[fromKey];
    const toEntry = monthlyBreakdown[toKey];
    if (!fromEntry || !toEntry) continue;

    const allCategoryIds = new Set<string>();
    Object.keys(fromEntry.expensesByCategory ?? {}).forEach((id) => allCategoryIds.add(id));
    Object.keys(toEntry.expensesByCategory ?? {}).forEach((id) => allCategoryIds.add(id));

    for (const id of allCategoryIds) {
      const fromAmount = fromEntry.expensesByCategory?.[id] ?? 0;
      const toAmount = toEntry.expensesByCategory?.[id] ?? 0;
      const change = toAmount - fromAmount;

      if (fromAmount === 0 && toAmount === 0) continue;

      const changePercent = fromAmount > 0 ? (change / fromAmount) * 100 : 100;
      const cat = categories.find((c) => c.id === id);
      const name = cat?.name ?? "Desconhecido";

      if (change > 0 && (!biggestIncrease || change > biggestIncrease.change)) {
        biggestIncrease = { name, change, changePercent, monthKey: toKey };
      }

      if (change < 0 && (!biggestDecrease || change < biggestDecrease.change)) {
        biggestDecrease = { name, change, changePercent, monthKey: toKey };
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
  const monthCount = allMonthEntries.length;
  const averageMonthlySpending =
    monthCount > 0
      ? roundCurrency({
          value: allMonthEntries.reduce((sum, m) => sum + m.expenses, 0) / monthCount,
        })
      : 0;
  const averageMonthlyIncome =
    monthCount > 0
      ? roundCurrency({
          value: allMonthEntries.reduce((sum, m) => sum + m.income, 0) / monthCount,
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
    averageMonthlyIncome,
  };
};
