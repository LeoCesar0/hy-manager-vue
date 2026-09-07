import type { IReport, IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { getDefaultMonths } from "~/helpers/get-default-months";
import { roundCurrency } from "~/helpers/roundCurrency";
import { aggregateMonthlyWindow } from "./aggregate-monthly-window";

// Behavior summary for a single category over a fixed 12-month window. Stats are
// reported for both flows (expense + deposit); peak/trough/trend/top-identifiers
// follow the dominant flow so the numbers read naturally whether the category is
// a cost (Mercado) or an inflow (Salário).
export type ICategoryWindowSummary = {
  primaryFlow: "expense" | "deposit";
  expenseAverage: number;
  expenseMedian: number;
  depositAverage: number;
  depositMedian: number;
  monthsInWindow: number;
  activeMonths: number; // active months of the dominant flow
  peakMonth: { key: string; value: number } | null;
  troughMonth: { key: string; value: number } | null;
  trend: { direction: "up" | "down" | "flat"; percent: number } | null;
  shareOfExpenses: number; // % of account expenses (window) from this category
  shareOfDeposits: number;
  topIdentifiers: { id: string; name: string; amount: number }[];
};

type IProps = {
  report: IReport;
  categories: ICategory[];
  counterparties: ICounterparty[];
  categoryId: string;
  referenceMonths?: string[];
  topN?: number;
};

const DEFAULT_TOP_N = 5;
// Below this magnitude a 3m-vs-3m percentage swing is noise, so the trend is
// reported as "flat".
const TREND_FLAT_EPSILON = 0.5;

const selectExpense =
  (categoryId: string) =>
  (entry: IMonthlyEntry): number =>
    entry.expensesByCategory[categoryId] ?? 0;

const selectDeposit =
  (categoryId: string) =>
  (entry: IMonthlyEntry): number =>
    entry.depositsByCategory[categoryId] ?? 0;

export const calculateCategoryWindowSummary = ({
  report,
  categories,
  counterparties,
  categoryId,
  referenceMonths,
  topN = DEFAULT_TOP_N,
}: IProps): ICategoryWindowSummary => {
  const monthKeys = referenceMonths ?? getDefaultMonths({ count: 12 });
  const monthlyBreakdown = report.monthlyBreakdown;

  const expense = aggregateMonthlyWindow({
    monthKeys,
    monthlyBreakdown,
    selectValue: selectExpense(categoryId),
  });
  const deposit = aggregateMonthlyWindow({
    monthKeys,
    monthlyBreakdown,
    selectValue: selectDeposit(categoryId),
  });

  const primaryFlow: "expense" | "deposit" =
    deposit.total > expense.total ? "deposit" : "expense";
  const selectPrimary =
    primaryFlow === "deposit"
      ? selectDeposit(categoryId)
      : selectExpense(categoryId);

  // Per-month series of the dominant flow, used for peak/trough/trend.
  const series = monthKeys.map((key) => {
    const entry = monthlyBreakdown[key];
    return { key, value: entry ? selectPrimary(entry) : 0 };
  });

  // Peak = highest month overall; trough = lowest among ACTIVE months (a zero
  // month would always win "lowest" and tell the user nothing).
  let peakMonth: { key: string; value: number } | null = null;
  let troughMonth: { key: string; value: number } | null = null;
  for (const point of series) {
    if (point.value <= 0) continue;
    if (!peakMonth || point.value > peakMonth.value) peakMonth = { ...point };
    if (!troughMonth || point.value < troughMonth.value) troughMonth = { ...point };
  }

  // Trend = sum of the last 3 window months vs the 3 before. Needs ≥ 6 months.
  let trend: ICategoryWindowSummary["trend"] = null;
  if (series.length >= 6) {
    const recent = series.slice(-3).reduce((s, p) => s + p.value, 0);
    const prior = series.slice(-6, -3).reduce((s, p) => s + p.value, 0);
    if (prior === 0 && recent === 0) {
      trend = { direction: "flat", percent: 0 };
    } else if (prior === 0) {
      trend = { direction: "up", percent: 100 };
    } else {
      const percent = roundCurrency({ value: ((recent - prior) / prior) * 100 });
      const direction =
        Math.abs(percent) < TREND_FLAT_EPSILON
          ? "flat"
          : percent > 0
            ? "up"
            : "down";
      trend = { direction, percent };
    }
  }

  // Share of the account's window totals.
  const accountExpenseTotal = monthKeys.reduce(
    (sum, key) => sum + (monthlyBreakdown[key]?.expenses ?? 0),
    0,
  );
  const accountDepositTotal = monthKeys.reduce(
    (sum, key) => sum + (monthlyBreakdown[key]?.income ?? 0),
    0,
  );
  const shareOfExpenses =
    accountExpenseTotal > 0
      ? roundCurrency({ value: (expense.total / accountExpenseTotal) * 100 })
      : 0;
  const shareOfDeposits =
    accountDepositTotal > 0
      ? roundCurrency({ value: (deposit.total / accountDepositTotal) * 100 })
      : 0;

  // Top identifiers from the dominant flow's 2D map.
  const identifierTotals: Record<string, number> = {};
  for (const key of monthKeys) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;
    const map =
      primaryFlow === "deposit"
        ? entry.depositsByCategoryAndCounterparty[categoryId]
        : entry.expensesByCategoryAndCounterparty[categoryId];
    if (!map) continue;
    for (const [id, amount] of Object.entries(map)) {
      identifierTotals[id] = (identifierTotals[id] ?? 0) + amount;
    }
  }
  const topIdentifiers = Object.entries(identifierTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, amount]) => ({
      id,
      name: counterparties.find((c) => c.id === id)?.name ?? "Desconhecido",
      amount: roundCurrency({ value: amount }),
    }));

  return {
    primaryFlow,
    expenseAverage: expense.average,
    expenseMedian: expense.median,
    depositAverage: deposit.average,
    depositMedian: deposit.median,
    monthsInWindow: monthKeys.length,
    activeMonths: primaryFlow === "deposit" ? deposit.activeMonths : expense.activeMonths,
    peakMonth,
    troughMonth,
    trend,
    shareOfExpenses,
    shareOfDeposits,
    topIdentifiers,
  };
};
