import type { IMonthlyEntry } from "~/@schemas/models/report";
import { roundCurrency } from "~/helpers/roundCurrency";
import { calculateMedian } from "~/helpers/calculateMedian";

// Stats for a single numeric series over a fixed month window.
export type IWindowStats = {
  average: number;
  median: number;
  total: number;
  // Number of months in the window where the series was > 0. Feeds a sub-label
  // like "ativo em 8 de 12 meses" so users understand a low average can come
  // from sparse activity rather than consistently small amounts.
  activeMonths: number;
};

// Controls what the average/median divide over:
// - "active-months" (default): only months with movement count. average = total /
//   activeMonths; median over the active (> 0) values. Gives the "typical value WHEN
//   there is movement" — a category active in 3 of 12 months isn't diluted by 9 zeros.
// - "fixed-window": every month in the window counts, zeros included. average = total /
//   monthKeys.length; median over the zero-padded series. Gives the "typical monthly
//   load across the whole window", comparable across categories.
export type IWindowAveraging = "active-months" | "fixed-window";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
  // Picks the series to aggregate from each month entry. Callers compose this:
  // total expenses → `(e) => e.expenses`; a category → `(e) => e.expensesByCategory[id] ?? 0`.
  selectValue: (entry: IMonthlyEntry) => number;
  averaging?: IWindowAveraging;
};

// Aggregates one numeric series over a month window. A month missing from
// monthlyBreakdown counts as 0. The `averaging` mode (default "active-months")
// decides whether zeros dilute the average/median — see IWindowAveraging.
export const aggregateMonthlyWindow = ({
  monthKeys,
  monthlyBreakdown,
  selectValue,
  averaging = "active-months",
}: IProps): IWindowStats => {
  const values = monthKeys.map((key) => {
    const entry = monthlyBreakdown[key];
    return entry ? selectValue(entry) : 0;
  });

  const total = values.reduce((sum, value) => sum + value, 0);
  const activeValues = values.filter((value) => value > 0);
  const activeMonths = activeValues.length;

  let average: number;
  let medianValues: number[];
  if (averaging === "fixed-window") {
    const windowLength = monthKeys.length;
    average = windowLength > 0 ? total / windowLength : 0;
    medianValues = values;
  } else {
    average = activeMonths > 0 ? total / activeMonths : 0;
    medianValues = activeValues;
  }

  return {
    average: roundCurrency({ value: average }),
    median: calculateMedian({ values: medianValues }),
    total: roundCurrency({ value: total }),
    activeMonths,
  };
};
