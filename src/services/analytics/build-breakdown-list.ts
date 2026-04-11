import type { IMonthlyEntry } from "~/@schemas/models/report";

// Which pair of per-entry maps to read from the monthly breakdown. Expense and
// deposit maps are always read together so the function can track both sides
// of each item.
export type IBreakdownFields = {
  expenseField: "expensesByCategory" | "expensesByCounterparty";
  depositField: "depositsByCategory" | "depositsByCounterparty";
};

export type IBreakdownListItem = {
  id: string;
  name: string;
  color: string | null;
  expenseTotal: number;
  depositTotal: number;
  // grossTotal is used for sort order — items with more *activity* (regardless
  // of direction) bubble to the top, matching "top spenders/earners" intent.
  grossTotal: number;
  // netTotal is deposits - expenses. Positive = item earned you money,
  // negative = item cost you money. Displayed in the list row.
  netTotal: number;
  // True for categories marked as positive-expense (Investimentos, Poupança).
  // Powers the "investimento" badge in the list UI so users can distinguish
  // saving from real spending at a glance. Always false/undefined for
  // counterparties — the constraint widens to allow the flag but
  // counterparties simply never carry it.
  isPositiveExpense?: boolean;
};

type IProps<T extends { id: string; name: string; color?: string | null; isPositiveExpense?: boolean }> = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  fields: IBreakdownFields;
  lookup: T[];
  topN: number;
};

export const buildBreakdownList = <
  T extends { id: string; name: string; color?: string | null; isPositiveExpense?: boolean },
>({
  monthKeys,
  monthlyBreakdown,
  fields,
  lookup,
  topN,
}: IProps<T>): IBreakdownListItem[] => {
  const expenseTotals = new Map<string, number>();
  const depositTotals = new Map<string, number>();

  for (const key of monthKeys) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;

    const expenseMap = entry[fields.expenseField] ?? {};
    for (const [id, amount] of Object.entries(expenseMap)) {
      expenseTotals.set(id, (expenseTotals.get(id) ?? 0) + amount);
    }

    const depositMap = entry[fields.depositField] ?? {};
    for (const [id, amount] of Object.entries(depositMap)) {
      depositTotals.set(id, (depositTotals.get(id) ?? 0) + amount);
    }
  }

  // Union of all IDs that appeared on either side — an item may be expense-only,
  // deposit-only, or mixed. We iterate the union so none are dropped.
  const allIds = new Set<string>([
    ...expenseTotals.keys(),
    ...depositTotals.keys(),
  ]);

  return [...allIds]
    .map((id): IBreakdownListItem => {
      const expenseTotal = expenseTotals.get(id) ?? 0;
      const depositTotal = depositTotals.get(id) ?? 0;
      const match = lookup.find((item) => item.id === id);
      return {
        id,
        name: match?.name ?? "Desconhecido",
        color: match?.color ?? null,
        expenseTotal,
        depositTotal,
        grossTotal: expenseTotal + depositTotal,
        netTotal: depositTotal - expenseTotal,
        isPositiveExpense: match?.isPositiveExpense ?? false,
      };
    })
    .filter((item) => item.grossTotal > 0)
    .sort((a, b) => b.grossTotal - a.grossTotal)
    .slice(0, topN);
};
