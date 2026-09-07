import type { IReport } from "~/@schemas/models/report";
import type { ICategory, CategoryIcon } from "~/@schemas/models/category";
import type { Nullish } from "~/@types/helpers";
import { getDefaultMonths } from "~/helpers/get-default-months";
import {
  aggregateMonthlyWindow,
  type IWindowStats,
} from "./aggregate-monthly-window";

// The default key categories shown in "Médias por categoria (12m)". Resolved by
// name against the user's categories (they match src/static/default-categories.ts).
// A future customizable widget will let users change this set — see the
// customizable-12mo-insights-widget observation.
export const KEY_CATEGORY_NAMES = [
  "Despesas",
  "Investimentos",
  "Salário",
  "Cartão de Crédito",
] as const;

// One key-category card: both flows (outflow + inflow) over the 12-month window,
// with the dominant flow flagged for visual emphasis, plus the category's own
// icon/color for identity.
export type IKeyCategoryInsight = {
  id: string;
  name: string;
  icon: Nullish<CategoryIcon>;
  color: Nullish<string>;
  dominantFlow: "expense" | "deposit";
  expense: IWindowStats;
  deposit: IWindowStats;
};

type IProps = {
  report: IReport;
  categories: ICategory[];
  // Defaults to the last 12 calendar months ending at the current month.
  referenceMonths?: string[];
};

export const calculateKeyCategoryInsights = ({
  report,
  categories,
  referenceMonths,
}: IProps): IKeyCategoryInsight[] => {
  const monthKeys = referenceMonths ?? getDefaultMonths({ count: 12 });
  const monthlyBreakdown = report.monthlyBreakdown;

  const insights: IKeyCategoryInsight[] = [];

  for (const name of KEY_CATEGORY_NAMES) {
    // Renamed/deleted categories simply drop out — match is by name until the
    // customizable widget allows selecting by id.
    const category = categories.find((c) => c.name === name);
    if (!category) continue;

    const expense = aggregateMonthlyWindow({
      monthKeys,
      monthlyBreakdown,
      selectValue: (entry) => entry.expensesByCategory[category.id] ?? 0,
    });
    const deposit = aggregateMonthlyWindow({
      monthKeys,
      monthlyBreakdown,
      selectValue: (entry) => entry.depositsByCategory[category.id] ?? 0,
    });

    // No movement in either direction → an empty card; skip it.
    if (expense.total === 0 && deposit.total === 0) continue;

    insights.push({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      dominantFlow: deposit.total > expense.total ? "deposit" : "expense",
      expense,
      deposit,
    });
  }

  return insights;
};
