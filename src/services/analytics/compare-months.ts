import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  categories: ICategory[];
  counterparties: ICounterparty[];
};

type IDelta = {
  id: string;
  name: string;
  amounts: Record<string, number>;
  change: number | null;
  changePercent: number | null;
};

export type IMonthlyComparison = {
  categoryDeltas: IDelta[];
  counterpartyDeltas: IDelta[];
  totals: {
    income: Record<string, number>;
    expenses: Record<string, number>;
    balance: Record<string, number>;
  };
};

export const compareMonths = ({
  monthKeys,
  monthlyBreakdown,
  categories,
  counterparties,
}: IProps): IMonthlyComparison => {
  const sorted = [...monthKeys].sort();

  const categoryIds = new Set<string>();
  const counterpartyIds = new Set<string>();

  for (const key of sorted) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;
    Object.keys(entry.expensesByCategory ?? {}).forEach((id) => categoryIds.add(id));
    Object.keys(entry.depositsByCategory ?? {}).forEach((id) => categoryIds.add(id));
    Object.keys(entry.expensesByCounterparty ?? {}).forEach((id) => counterpartyIds.add(id));
    Object.keys(entry.depositsByCounterparty ?? {}).forEach((id) => counterpartyIds.add(id));
  }

  const categoryDeltas: IDelta[] = [...categoryIds].map((id) => {
    const cat = categories.find((c) => c.id === id);
    const amounts: Record<string, number> = {};

    for (const key of sorted) {
      const entry = monthlyBreakdown[key];
      const expenseAmount = entry?.expensesByCategory?.[id] ?? 0;
      const depositAmount = entry?.depositsByCategory?.[id] ?? 0;
      amounts[key] = expenseAmount + depositAmount;
    }

    const first = sorted.length >= 2 ? (amounts[sorted[0]!] ?? 0) : null;
    const last = sorted.length >= 2 ? (amounts[sorted[sorted.length - 1]!] ?? 0) : null;

    let change: number | null = null;
    let changePercent: number | null = null;

    if (first !== null && last !== null) {
      change = last - first;
      changePercent = first > 0 ? ((last - first) / first) * 100 : null;
    }

    return { id, name: cat?.name ?? "Desconhecido", amounts, change, changePercent };
  });

  const counterpartyDeltas: IDelta[] = [...counterpartyIds].map((id) => {
    const cp = counterparties.find((c) => c.id === id);
    const amounts: Record<string, number> = {};

    for (const key of sorted) {
      const entry = monthlyBreakdown[key];
      const expenseAmount = entry?.expensesByCounterparty?.[id] ?? 0;
      const depositAmount = entry?.depositsByCounterparty?.[id] ?? 0;
      amounts[key] = expenseAmount + depositAmount;
    }

    const first = sorted.length >= 2 ? (amounts[sorted[0]!] ?? 0) : null;
    const last = sorted.length >= 2 ? (amounts[sorted[sorted.length - 1]!] ?? 0) : null;

    let change: number | null = null;
    let changePercent: number | null = null;

    if (first !== null && last !== null) {
      change = last - first;
      changePercent = first > 0 ? ((last - first) / first) * 100 : null;
    }

    return { id, name: cp?.name ?? "Desconhecido", amounts, change, changePercent };
  });

  const totals: IMonthlyComparison["totals"] = {
    income: {},
    expenses: {},
    balance: {},
  };

  for (const key of sorted) {
    const entry = monthlyBreakdown[key];
    totals.income[key] = entry?.income ?? 0;
    totals.expenses[key] = entry?.expenses ?? 0;
    totals.balance[key] = (entry?.income ?? 0) - (entry?.expenses ?? 0);
  }

  categoryDeltas.sort((a, b) => {
    const lastKey = sorted[sorted.length - 1]!;
    return (b.amounts[lastKey] ?? 0) - (a.amounts[lastKey] ?? 0);
  });

  counterpartyDeltas.sort((a, b) => {
    const lastKey = sorted[sorted.length - 1]!;
    return (b.amounts[lastKey] ?? 0) - (a.amounts[lastKey] ?? 0);
  });

  return { categoryDeltas, counterpartyDeltas, totals };
};
