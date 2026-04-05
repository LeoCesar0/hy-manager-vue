import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  categories: ICategory[];
  counterparties: ICounterparty[];
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
}: IProps): IPeriodBreakdowns => {
  const expenseCategoryTotals = new Map<string, number>();
  const depositCategoryTotals = new Map<string, number>();
  const expenseCounterpartyTotals = new Map<string, number>();
  const depositCounterpartyTotals = new Map<string, number>();

  for (const key of monthKeys) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;

    for (const [id, amount] of Object.entries(entry.expensesByCategory ?? {})) {
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
