import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { splitPositiveExpenses } from "./split-positive-expenses";

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
  isPositiveExpense?: boolean;
};

export type IMonthlyComparison = {
  categoryDeltas: IDelta[];
  counterpartyDeltas: IDelta[];
  totals: {
    income: Record<string, number>;
    // Real expenses — excludes positive-expense categories (investments,
    // savings deposits). The split-off amount is exposed as positiveExpenses
    // so the UI can surface both numbers in the per-month summary.
    expenses: Record<string, number>;
    positiveExpenses: Record<string, number>;
    // Balance stays raw: income − rawExpenses. It tracks money that actually
    // left the operating account, which investments still did. Matches the
    // "Saldo (ano)" KPI semantics.
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

    return {
      id,
      name: cat?.name ?? "Desconhecido",
      amounts,
      change,
      changePercent,
      ...(cat?.isPositiveExpense && { isPositiveExpense: true }),
    };
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
    positiveExpenses: {},
    balance: {},
  };

  for (const key of sorted) {
    const entry = monthlyBreakdown[key];
    const income = entry?.income ?? 0;
    const rawExpenses = entry?.expenses ?? 0;
    const split = entry
      ? splitPositiveExpenses({ entry, categories })
      : { realExpenses: 0, positiveExpenses: 0, rawExpenses: 0 };
    totals.income[key] = income;
    totals.expenses[key] = split.realExpenses;
    totals.positiveExpenses[key] = split.positiveExpenses;
    totals.balance[key] = income - rawExpenses;
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
