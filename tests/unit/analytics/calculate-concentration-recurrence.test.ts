import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  makeReport,
  makeCategory,
  makeCounterparty,
  makeMonthlyEntry,
} from "../../helpers";
import { calculateConcentrationRecurrence } from "~/services/analytics/calculate-concentration-recurrence";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

// 10-month window so the 80% recurrence threshold = 8 months.
const WINDOW = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
  "2025-06", "2025-07", "2025-08", "2025-09", "2025-10",
];

describe("calculateConcentrationRecurrence", () => {
  it("computes the top-N category share of period real expenses", () => {
    const categories = [
      makeCategory({ id: "cat-a", name: "A" }),
      makeCategory({ id: "cat-b", name: "B" }),
      makeCategory({ id: "cat-c", name: "C" }),
      makeCategory({ id: "cat-d", name: "D" }),
    ];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-a": 600, "cat-b": 200, "cat-c": 100, "cat-d": 100 },
          }),
        },
      })
    );

    const result = calculateConcentrationRecurrence({
      report,
      selectedMonths: ["2025-01"],
      categories,
      counterparties: [],
      referenceMonths: WINDOW,
      topN: 3,
    });

    // total 1000; top 3 = 600+200+100 = 900 → 90%.
    expect(result.topCategoryShare).toBe(90);
    expect(result.topCategories.map((c) => c.id)).toEqual(["cat-a", "cat-b", "cat-c"]);
  });

  it("flags counterparties present in at least 80% of window months", () => {
    const counterparties = [
      makeCounterparty({ id: "cp-netflix", name: "Netflix" }),
      makeCounterparty({ id: "cp-oneoff", name: "Loja Avulsa" }),
    ];

    const monthlyBreakdown: Record<string, ReturnType<typeof makeMonthlyEntry>> = {};
    // Netflix in 9 of 10 months (≥ 8 threshold → recurring).
    WINDOW.forEach((key, index) => {
      const expensesByCounterparty: Record<string, number> = {};
      if (index < 9) expensesByCounterparty["cp-netflix"] = 40;
      // One-off appears in only 2 months → not recurring.
      if (index < 2) expensesByCounterparty["cp-oneoff"] = 500;
      monthlyBreakdown[key] = makeMonthlyEntry({ expensesByCounterparty });
    });

    const result = calculateConcentrationRecurrence({
      report: asReport(makeReport({ monthlyBreakdown })),
      selectedMonths: ["2025-01"],
      categories: [],
      counterparties,
      referenceMonths: WINDOW,
    });

    expect(result.recurringCounterparties).toEqual([
      { id: "cp-netflix", name: "Netflix", monthsActive: 9 },
    ]);
    expect(result.monthsInWindow).toBe(10);
  });
});
