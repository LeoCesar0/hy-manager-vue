import type { IReport } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { getDefaultMonths } from "~/helpers/get-default-months";
import { roundCurrency } from "~/helpers/roundCurrency";

// Two structural reads of the budget:
// - concentration: how much of the period's spend sits in the top-N categories;
// - recurrence: which counterparties show up in nearly every month (likely
//   subscriptions / fixed bills).
export type IConcentrationRecurrence = {
  topCategoryShare: number; // % of period real expenses in the top-N categories
  topCategories: { id: string; name: string; amount: number }[];
  recurringCounterparties: { id: string; name: string; monthsActive: number }[];
  monthsInWindow: number;
};

type IProps = {
  report: IReport;
  selectedMonths: string[];
  categories: ICategory[];
  counterparties: ICounterparty[];
  referenceMonths?: string[];
  topN?: number;
};

const DEFAULT_TOP_N = 3;
// A counterparty present in ≥ 80% of the window's months reads as a recurring
// fixed cost rather than a one-off.
const RECURRENCE_MIN_RATIO = 0.8;

export const calculateConcentrationRecurrence = ({
  report,
  selectedMonths,
  categories,
  counterparties,
  referenceMonths,
  topN = DEFAULT_TOP_N,
}: IProps): IConcentrationRecurrence => {
  const period = [...selectedMonths].sort();
  const windowMonths = referenceMonths ?? getDefaultMonths({ count: 12 });
  const monthlyBreakdown = report.monthlyBreakdown;

  const positiveExpenseIds = new Set(
    categories.filter((c) => c.isPositiveExpense).map((c) => c.id),
  );

  // --- Concentration: top-N category share of period real expenses ---
  const categoryTotals: Record<string, number> = {};
  for (const key of period) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;
    for (const [id, amount] of Object.entries(entry.expensesByCategory ?? {})) {
      if (positiveExpenseIds.has(id)) continue;
      categoryTotals[id] = (categoryTotals[id] ?? 0) + amount;
    }
  }

  const totalExpenses = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  );
  const topCategories = sortedCategories.slice(0, topN).map(([id, amount]) => ({
    id,
    name: categories.find((c) => c.id === id)?.name ?? "Desconhecido",
    amount: roundCurrency({ value: amount }),
  }));
  const topSum = topCategories.reduce((s, c) => s + c.amount, 0);
  const topCategoryShare =
    totalExpenses > 0
      ? roundCurrency({ value: (topSum / totalExpenses) * 100 })
      : 0;

  // --- Recurrence: counterparties active in ≥ RECURRENCE_MIN_RATIO of months ---
  const monthsActive: Record<string, number> = {};
  for (const key of windowMonths) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;
    for (const [id, amount] of Object.entries(entry.expensesByCounterparty ?? {})) {
      if (amount > 0) monthsActive[id] = (monthsActive[id] ?? 0) + 1;
    }
  }

  const threshold = Math.ceil(windowMonths.length * RECURRENCE_MIN_RATIO);
  const recurringCounterparties = Object.entries(monthsActive)
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      name: counterparties.find((c) => c.id === id)?.name ?? "Desconhecido",
      monthsActive: count,
    }));

  return {
    topCategoryShare,
    topCategories,
    recurringCounterparties,
    monthsInWindow: windowMonths.length,
  };
};
