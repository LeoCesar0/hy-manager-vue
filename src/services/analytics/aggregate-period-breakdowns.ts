import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  categories: ICategory[];
  counterparties: ICounterparty[];
  // When false (default), categories flagged with isPositiveExpense (e.g.
  // Investimentos, Poupança) are removed from the expense-by-category totals.
  // Deposit totals are never filtered — positive-expense is an expense-side
  // concept only. The default answers "where did my money actually go?" —
  // users can toggle to see the full outflow breakdown when they want to
  // audit total cash movement.
  includePositiveExpenseCategories?: boolean;
};

// Matches the shape DonutChart.vue expects: { id, name, amount, color? }
export type IDonutDataItem = {
  id: string;
  name: string;
  amount: number;
  color?: string;
};

export type IPeriodBreakdowns = {
  expensesByCategory: IDonutDataItem[];
  depositsByCategory: IDonutDataItem[];
  expensesByCounterparty: IDonutDataItem[];
  depositsByCounterparty: IDonutDataItem[];
};

// Note: the pre-computed report only tracks per-category/per-counterparty totals
// for transactions that actually have a category/counterparty set. Transactions
// without them are included in monthly `income`/`expenses` totals but NOT in the
// per-category maps, so this aggregator will never produce "uncategorized" /
// "no-counterparty" slices (unlike the Dashboard donuts which derive them from
// raw transactions).
const toSortedDonutItems = <T extends { id: string; name: string; color?: string | null }>({
  totals,
  lookup,
}: {
  totals: Map<string, number>;
  lookup: T[];
}): IDonutDataItem[] => {
  return [...totals.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]): IDonutDataItem => {
      const match = lookup.find((item) => item.id === id);
      return {
        id,
        name: match?.name ?? "Desconhecido",
        amount,
        color: match?.color ?? undefined,
      };
    })
    .sort((a, b) => b.amount - a.amount);
};

export const aggregatePeriodBreakdowns = ({
  monthKeys,
  monthlyBreakdown,
  categories,
  counterparties,
  includePositiveExpenseCategories = false,
}: IProps): IPeriodBreakdowns => {
  const expenseCategoryTotals = new Map<string, number>();
  const depositCategoryTotals = new Map<string, number>();
  const expenseCounterpartyTotals = new Map<string, number>();
  const depositCounterpartyTotals = new Map<string, number>();

  const positiveExpenseIds = includePositiveExpenseCategories
    ? null
    : new Set(categories.filter((c) => c.isPositiveExpense).map((c) => c.id));

  // Per-counterparty running total of the positive-expense slice across the
  // period. Subtracted from `expenseCounterpartyTotals` at the end when the
  // toggle is off. Sourced from the cross-ref map introduced in the
  // 2026-04-11 schema enrichment; on old reports that haven't been Recalcular'd
  // yet, the cross-ref is empty and this subtraction silently no-ops.
  const positiveCounterpartySubtract = new Map<string, number>();

  for (const key of monthKeys) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;

    for (const [id, amount] of Object.entries(entry.expensesByCategory ?? {})) {
      if (positiveExpenseIds && positiveExpenseIds.has(id)) continue;
      expenseCategoryTotals.set(id, (expenseCategoryTotals.get(id) ?? 0) + amount);
    }
    for (const [id, amount] of Object.entries(entry.depositsByCategory ?? {})) {
      depositCategoryTotals.set(id, (depositCategoryTotals.get(id) ?? 0) + amount);
    }
    for (const [id, amount] of Object.entries(entry.expensesByCounterparty ?? {})) {
      expenseCounterpartyTotals.set(
        id,
        (expenseCounterpartyTotals.get(id) ?? 0) + amount
      );
    }
    for (const [id, amount] of Object.entries(entry.depositsByCounterparty ?? {})) {
      depositCounterpartyTotals.set(
        id,
        (depositCounterpartyTotals.get(id) ?? 0) + amount
      );
    }

    if (positiveExpenseIds) {
      const crossRef = entry.expensesByCategoryAndCounterparty ?? {};
      for (const catId of positiveExpenseIds) {
        const inner = crossRef[catId];
        if (!inner) continue;
        for (const [cpId, amount] of Object.entries(inner)) {
          positiveCounterpartySubtract.set(
            cpId,
            (positiveCounterpartySubtract.get(cpId) ?? 0) + amount
          );
        }
      }
    }
  }

  if (positiveExpenseIds) {
    for (const [cpId, toSubtract] of positiveCounterpartySubtract) {
      const total = expenseCounterpartyTotals.get(cpId);
      if (total === undefined) continue;
      const next = total - toSubtract;
      if (next <= 0) expenseCounterpartyTotals.delete(cpId);
      else expenseCounterpartyTotals.set(cpId, next);
    }
  }

  return {
    expensesByCategory: toSortedDonutItems({
      totals: expenseCategoryTotals,
      lookup: categories,
    }),
    depositsByCategory: toSortedDonutItems({
      totals: depositCategoryTotals,
      lookup: categories,
    }),
    expensesByCounterparty: toSortedDonutItems({
      totals: expenseCounterpartyTotals,
      lookup: counterparties,
    }),
    depositsByCounterparty: toSortedDonutItems({
      totals: depositCounterpartyTotals,
      lookup: counterparties,
    }),
  };
};
