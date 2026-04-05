import type { IMonthlyEntry } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { roundCurrency } from "~/helpers/roundCurrency";

// Categories flagged with isPositiveExpense (investments, savings deposits,
// etc.) represent outflows that are actually saving, not cost. Aggregated
// metrics like "Gasto médio mensal", "Saídas (ano)" and savings rate should
// treat them as a separate bucket rather than counting them against the user.
export type IExpenseSplit = {
  // entry.expenses — every expense transaction, unchanged.
  rawExpenses: number;
  // Σ expensesByCategory[id] restricted to isPositiveExpense categories.
  positiveExpenses: number;
  // rawExpenses − positiveExpenses, clamped to ≥ 0. The clamp guards against
  // the pre-existing multi-category double-counting in
  // apply-transaction-to-report (see the observation of the same name): a
  // transaction with `categoryIds: ["positive", "regular"]` contributes its
  // full amount to both buckets but only once to `expenses`, so the subtraction
  // can go negative. Fixing the root is scoped separately.
  realExpenses: number;
};

type IProps = {
  entry: IMonthlyEntry;
  categories: ICategory[];
};

export const splitPositiveExpenses = ({ entry, categories }: IProps): IExpenseSplit => {
  const positiveIds = new Set(
    categories.filter((c) => c.isPositiveExpense).map((c) => c.id),
  );

  const byCategory = entry.expensesByCategory ?? {};
  let positiveExpenses = 0;
  for (const [id, amount] of Object.entries(byCategory)) {
    if (positiveIds.has(id)) {
      positiveExpenses += amount;
    }
  }

  const rawExpenses = entry.expenses;
  const realExpenses = Math.max(0, rawExpenses - positiveExpenses);

  return {
    rawExpenses: roundCurrency({ value: rawExpenses }),
    positiveExpenses: roundCurrency({ value: positiveExpenses }),
    realExpenses: roundCurrency({ value: realExpenses }),
  };
};
