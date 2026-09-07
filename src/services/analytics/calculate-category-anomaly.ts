import type { IReport } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { getDefaultMonths } from "~/helpers/get-default-months";
import { roundCurrency } from "~/helpers/roundCurrency";
import { aggregateMonthlyWindow } from "./aggregate-monthly-window";

// The category whose selected-period spend deviates most ABOVE its own
// 12-month baseline — "Restaurantes: 23% acima da média de 12m".
export type ICategoryAnomaly = {
  categoryId: string;
  name: string;
  periodAverage: number; // per-month average across the selected period
  twelveMonthAverage: number; // per-month average across the 12-month window
  deviationPercent: number; // (period − 12m) / 12m × 100, always > 0 here
};

type IProps = {
  report: IReport;
  selectedMonths: string[];
  categories: ICategory[];
  referenceMonths?: string[];
};

// Below this 12-month monthly average a category is too small for a percentage
// deviation to be meaningful (a R$2 → R$8 jump is +300% but noise).
const MIN_BASELINE_AVERAGE = 50;

export const calculateCategoryAnomaly = ({
  report,
  selectedMonths,
  categories,
  referenceMonths,
}: IProps): ICategoryAnomaly | null => {
  const period = [...selectedMonths].sort();
  if (period.length === 0) return null;

  const monthlyBreakdown = report.monthlyBreakdown;
  const windowMonths = referenceMonths ?? getDefaultMonths({ count: 12 });

  // Investments aren't "spending" — a spike into savings shouldn't read as an
  // anomaly in the user's costs.
  const positiveExpenseIds = new Set(
    categories.filter((c) => c.isPositiveExpense).map((c) => c.id),
  );

  // Candidate categories = those with expense in the selected period.
  const candidateIds = new Set<string>();
  for (const key of period) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;
    for (const id of Object.keys(entry.expensesByCategory ?? {})) {
      if (!positiveExpenseIds.has(id)) candidateIds.add(id);
    }
  }

  let winner: ICategoryAnomaly | null = null;

  for (const id of candidateIds) {
    const periodTotal = period.reduce(
      (sum, key) => sum + (monthlyBreakdown[key]?.expensesByCategory[id] ?? 0),
      0,
    );
    const periodAverage = roundCurrency({ value: periodTotal / period.length });

    // Fixed-window baseline: the period average above divides by the full period
    // length (zeros included), so the 12m baseline must divide the same way to keep
    // the deviation comparison apples-to-apples.
    const baseline = aggregateMonthlyWindow({
      monthKeys: windowMonths,
      monthlyBreakdown,
      selectValue: (entry) => entry.expensesByCategory[id] ?? 0,
      averaging: "fixed-window",
    });

    if (baseline.average < MIN_BASELINE_AVERAGE) continue;
    if (periodAverage <= baseline.average) continue;

    const deviationPercent = roundCurrency({
      value: ((periodAverage - baseline.average) / baseline.average) * 100,
    });

    if (!winner || deviationPercent > winner.deviationPercent) {
      const name = categories.find((c) => c.id === id)?.name ?? "Desconhecido";
      winner = {
        categoryId: id,
        name,
        periodAverage,
        twelveMonthAverage: baseline.average,
        deviationPercent,
      };
    }
  }

  return winner;
};
