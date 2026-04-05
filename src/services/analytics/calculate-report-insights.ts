import type { IReport } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { roundCurrency } from "~/helpers/roundCurrency";
import { splitPositiveExpenses } from "./split-positive-expenses";

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
  // ytdExpenses excludes positive-expense categories (investments, savings,
  // etc.). The split-off portion is exposed as ytdPositiveExpenses so the UI
  // can surface both numbers in a single card. ytdBalance stays raw — "saldo"
  // reflects the operating account, which investments still leave.
  ytdExpenses: number;
  ytdPositiveExpenses: number;
  ytdBalance: number;
  // averageMonthlySpending is also "real" (excludes positive-expense
  // categories). averageMonthlyPositiveExpenses carries the split.
  averageMonthlySpending: number;
  averageMonthlyPositiveExpenses: number;
  averageMonthlyIncome: number;
};

export const calculateReportInsights = ({
  report,
  selectedMonths,
  categories,
}: IProps): IReportInsights => {
  const sorted = [...selectedMonths].sort();
  const monthlyBreakdown = report.monthlyBreakdown;

  // Set of positive-expense category ids — used both to skip them in the
  // increase/decrease scan and (via splitPositiveExpenses) to carve them out
  // of the aggregate totals.
  const positiveExpenseIds = new Set(
    categories.filter((c) => c.isPositiveExpense).map((c) => c.id),
  );

  const totalIncome = sorted.reduce((sum, key) => sum + (monthlyBreakdown[key]?.income ?? 0), 0);
  // Savings rate should reflect *real* spending, otherwise every dollar sent
  // to investments makes the user look like they're saving less.
  const totalRealExpenses = sorted.reduce((sum, key) => {
    const entry = monthlyBreakdown[key];
    if (!entry) return sum;
    return sum + splitPositiveExpenses({ entry, categories }).realExpenses;
  }, 0);

  const savingsRate = totalIncome > 0
    ? roundCurrency({ value: ((totalIncome - totalRealExpenses) / totalIncome) * 100 })
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
      // Skip positive-expense categories — increasing investments isn't a
      // "spending increase" and would actively mislead the card.
      if (positiveExpenseIds.has(id)) continue;

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
  // ytdBalance uses raw expenses deliberately — it represents money that left
  // the operating account, which investments still did.
  const ytdRawExpenses = ytdMonths.reduce((sum, [, m]) => sum + m.expenses, 0);
  const ytdSplit = ytdMonths.reduce(
    (acc, [, entry]) => {
      const split = splitPositiveExpenses({ entry, categories });
      return {
        real: acc.real + split.realExpenses,
        positive: acc.positive + split.positiveExpenses,
      };
    },
    { real: 0, positive: 0 },
  );
  const ytdBalance = roundCurrency({ value: ytdIncome - ytdRawExpenses });

  const allMonthEntries = Object.values(monthlyBreakdown);
  const monthCount = allMonthEntries.length;
  // Average spending uses "real" expenses — investments are savings, not
  // spending, and counting them inflates the headline number.
  const totalsForAverage = allMonthEntries.reduce(
    (acc, entry) => {
      const split = splitPositiveExpenses({ entry, categories });
      return {
        realExpenses: acc.realExpenses + split.realExpenses,
        positiveExpenses: acc.positiveExpenses + split.positiveExpenses,
        income: acc.income + entry.income,
      };
    },
    { realExpenses: 0, positiveExpenses: 0, income: 0 },
  );
  const averageMonthlySpending =
    monthCount > 0
      ? roundCurrency({ value: totalsForAverage.realExpenses / monthCount })
      : 0;
  const averageMonthlyPositiveExpenses =
    monthCount > 0
      ? roundCurrency({ value: totalsForAverage.positiveExpenses / monthCount })
      : 0;
  const averageMonthlyIncome =
    monthCount > 0
      ? roundCurrency({ value: totalsForAverage.income / monthCount })
      : 0;

  return {
    savingsRate,
    biggestIncrease,
    biggestDecrease,
    ytdIncome: roundCurrency({ value: ytdIncome }),
    ytdExpenses: roundCurrency({ value: ytdSplit.real }),
    ytdPositiveExpenses: roundCurrency({ value: ytdSplit.positive }),
    ytdBalance,
    averageMonthlySpending,
    averageMonthlyPositiveExpenses,
    averageMonthlyIncome,
  };
};
