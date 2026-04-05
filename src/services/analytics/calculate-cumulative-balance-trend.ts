import type { IMonthlyEntry } from "~/@schemas/models/report";

type IProps = {
  monthKeys: string[];
  monthlyBreakdown: Record<string, IMonthlyEntry>;
};

export type ICumulativeBalancePoint = {
  label: string;
  monthBalance: number;
  cumulative: number;
};

// Running sum of (income - expenses) across the selected months, in order.
// Note: this is cumulative *within the selection*, not an absolute account
// balance — we don't know the starting balance before the first selected month.
export const calculateCumulativeBalanceTrend = ({
  monthKeys,
  monthlyBreakdown,
}: IProps): ICumulativeBalancePoint[] => {
  const sorted = [...monthKeys].sort();
  let running = 0;

  return sorted.map((key) => {
    const entry = monthlyBreakdown[key];
    const income = entry?.income ?? 0;
    const expenses = entry?.expenses ?? 0;
    const monthBalance = income - expenses;
    running += monthBalance;
    const [year, month] = key.split("-");

    return {
      label: `${month}/${year}`,
      monthBalance,
      cumulative: running,
    };
  });
};
