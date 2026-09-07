import type { IReport } from "~/@schemas/models/report";
import { getDefaultMonths } from "~/helpers/get-default-months";
import { aggregateMonthlyWindow } from "./aggregate-monthly-window";

// One row of the "Resumo mensal (12m)" block: average AND median monthly value of
// a total series over the 12-month window. Only aggregate totals live here —
// per-category averages moved to calculate-key-category-insights. `key` is a
// stable identifier for the row; `label` is user-facing.
export type ITwelveMonthInsightRow = {
  key: "expenses" | "income";
  label: string;
  average: number;
  median: number;
  // Months in the window where the series had movement; average/median consider
  // only these (active-months semantics) — feeds a "N meses com movimento" label.
  activeMonths: number;
  monthsInWindow: number;
};

type IProps = {
  report: IReport;
  // Defaults to the last 12 calendar months ending at the current month.
  referenceMonths?: string[];
};

export const calculateTwelveMonthInsights = ({
  report,
  referenceMonths,
}: IProps): ITwelveMonthInsightRow[] => {
  const monthKeys = referenceMonths ?? getDefaultMonths({ count: 12 });
  const monthlyBreakdown = report.monthlyBreakdown;
  const monthsInWindow = monthKeys.length;

  const expenses = aggregateMonthlyWindow({
    monthKeys,
    monthlyBreakdown,
    selectValue: (entry) => entry.expenses,
  });

  const income = aggregateMonthlyWindow({
    monthKeys,
    monthlyBreakdown,
    selectValue: (entry) => entry.income,
  });

  return [
    {
      key: "expenses",
      label: "Despesas totais",
      average: expenses.average,
      median: expenses.median,
      activeMonths: expenses.activeMonths,
      monthsInWindow,
    },
    {
      key: "income",
      label: "Receitas totais",
      average: income.average,
      median: income.median,
      activeMonths: income.activeMonths,
      monthsInWindow,
    },
  ];
};
