import type { IReport } from "~/@schemas/models/report";
import type { ICategory } from "~/@schemas/models/category";
import { roundCurrency } from "~/helpers/roundCurrency";

// Average ticket and frequency for a category over the selected period:
// "Mercado: R$ 87/ida · 23 idas". Derived from the per-category amount and the
// per-category transaction count the report already stores.
export type ITicketFrequencyItem = {
  categoryId: string;
  name: string;
  total: number;
  count: number;
  averageTicket: number;
};

type IProps = {
  report: IReport;
  selectedMonths: string[];
  categories: ICategory[];
  topN?: number;
};

const DEFAULT_TOP_N = 3;

export const calculateTicketFrequency = ({
  report,
  selectedMonths,
  categories,
  topN = DEFAULT_TOP_N,
}: IProps): ITicketFrequencyItem[] => {
  const period = [...selectedMonths].sort();
  const monthlyBreakdown = report.monthlyBreakdown;

  // Investments distort "ticket médio" (one large transfer), so keep this about
  // real spending categories.
  const positiveExpenseIds = new Set(
    categories.filter((c) => c.isPositiveExpense).map((c) => c.id),
  );

  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const key of period) {
    const entry = monthlyBreakdown[key];
    if (!entry) continue;
    for (const [id, amount] of Object.entries(entry.expensesByCategory ?? {})) {
      if (positiveExpenseIds.has(id)) continue;
      totals[id] = (totals[id] ?? 0) + amount;
    }
    for (const [id, count] of Object.entries(entry.expensesByCategoryCount ?? {})) {
      if (positiveExpenseIds.has(id)) continue;
      counts[id] = (counts[id] ?? 0) + count;
    }
  }

  const items: ITicketFrequencyItem[] = Object.entries(totals)
    .map(([id, total]) => {
      const count = counts[id] ?? 0;
      return {
        categoryId: id,
        name: categories.find((c) => c.id === id)?.name ?? "Desconhecido",
        total: roundCurrency({ value: total }),
        count,
        averageTicket: count > 0 ? roundCurrency({ value: total / count }) : 0,
      };
    })
    // A category with amount but no count would yield a 0 ticket — drop it
    // rather than show a misleading "R$ 0/ida".
    .filter((item) => item.count > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);

  return items;
};
