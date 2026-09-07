import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeReport, makeMonthlyEntry } from "../../helpers";
import { calculateTwelveMonthInsights } from "~/services/analytics/calculate-twelve-month-insights";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

// Fixed window passed explicitly so the test does not depend on the wall clock.
const WINDOW = ["2025-01", "2025-02", "2025-03", "2025-04"];

describe("calculateTwelveMonthInsights", () => {
  it("returns exactly the expenses and income total rows", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ income: 4000, expenses: 2000 }),
          "2025-03": makeMonthlyEntry({ income: 4000, expenses: 4000 }),
        },
      })
    );

    const rows = calculateTwelveMonthInsights({ report, referenceMonths: WINDOW });

    expect(rows.map((r) => r.key)).toEqual(["expenses", "income"]);
  });

  it("averages over active months only, ignoring zero months", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ income: 4000, expenses: 2000 }),
          "2025-03": makeMonthlyEntry({ income: 4000, expenses: 4000 }),
        },
      })
    );

    const rows = calculateTwelveMonthInsights({ report, referenceMonths: WINDOW });

    const expenses = rows.find((r) => r.key === "expenses")!;
    // total 6000 over 2 active months → average 3000 (not 1500); median of [2000,4000] = 3000.
    expect(expenses.average).toBe(3000);
    expect(expenses.median).toBe(3000);
    expect(expenses.activeMonths).toBe(2);
    expect(expenses.monthsInWindow).toBe(4);

    const income = rows.find((r) => r.key === "income")!;
    // 8000 over 2 active months → 4000.
    expect(income.average).toBe(4000);
    expect(income.activeMonths).toBe(2);
  });

  it("yields zeroed rows for an empty window without throwing", () => {
    const report = asReport(makeReport({ monthlyBreakdown: {} }));

    const rows = calculateTwelveMonthInsights({ report, referenceMonths: WINDOW });

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.average).toBe(0);
      expect(row.median).toBe(0);
      expect(row.activeMonths).toBe(0);
    }
  });
});
