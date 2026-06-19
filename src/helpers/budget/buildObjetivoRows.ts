import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { IBudget } from "~/@schemas/models/budget";

export type IObjetivoRow = {
  bankAccountId: string;
  bankAccountName: string;
  // The persisted objetivo doc, or null when the account has none configured yet.
  budget: IBudget | null;
  monthlyExpenseLimit: number | null;
  monthlyIncomeGoal: number | null;
  categoryBudgetsCount: number;
  // True when no objetivo values have been set (no doc, or a doc with all
  // fields empty) — drives the "Criar objetivo" affordance on the page.
  isConfigured: boolean;
};

type IProps = {
  bankAccounts: IBankAccount[];
  budgets: IBudget[];
};

// Whether a budget doc carries any meaningful objetivo data. A bare doc (created
// by getOrCreateBudget with all-null fields and no category budgets) counts as
// "not configured" so the UI offers a create affordance rather than an edit one.
const hasObjetivoData = (budget: IBudget): boolean =>
  budget.monthlyExpenseLimit !== null ||
  budget.monthlyIncomeGoal !== null ||
  budget.categoryBudgets.length > 0;

/**
 * Joins the user's bank accounts with their objetivo (budget) docs to produce
 * one row per bank account. Accounts without a doc yield a row with
 * `budget: null` and `isConfigured: false`. Budget docs map to accounts by
 * `bankAccountId` (the budget doc id equals the bank account id in the
 * per-account model).
 */
export const buildObjetivoRows = ({
  bankAccounts,
  budgets,
}: IProps): IObjetivoRow[] => {
  const budgetByAccountId = new Map<string, IBudget>();
  for (const budget of budgets) {
    budgetByAccountId.set(budget.bankAccountId, budget);
  }

  return bankAccounts.map((account) => {
    const budget = budgetByAccountId.get(account.id) ?? null;

    return {
      bankAccountId: account.id,
      bankAccountName: account.name,
      budget,
      monthlyExpenseLimit: budget?.monthlyExpenseLimit ?? null,
      monthlyIncomeGoal: budget?.monthlyIncomeGoal ?? null,
      categoryBudgetsCount: budget?.categoryBudgets.length ?? 0,
      isConfigured: budget !== null && hasObjetivoData(budget),
    };
  });
};
