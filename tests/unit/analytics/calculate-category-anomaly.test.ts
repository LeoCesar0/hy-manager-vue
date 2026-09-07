import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeReport, makeCategory, makeMonthlyEntry } from "../../helpers";
import { calculateCategoryAnomaly } from "~/services/analytics/calculate-category-anomaly";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

const WINDOW = ["2025-01", "2025-02", "2025-03", "2025-04"];

describe("calculateCategoryAnomaly", () => {
  it("surfaces the category whose period spend is most above its 12-month average", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Restaurantes" }),
      makeCategory({ id: "cat-transport", name: "Transporte" }),
    ];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          // Baseline window: food ~100/mo, transport ~200/mo.
          "2025-01": makeMonthlyEntry({ expensesByCategory: { "cat-food": 100, "cat-transport": 200 } }),
          "2025-02": makeMonthlyEntry({ expensesByCategory: { "cat-food": 100, "cat-transport": 200 } }),
          "2025-03": makeMonthlyEntry({ expensesByCategory: { "cat-food": 100, "cat-transport": 200 } }),
          // Selected period (April): food spikes to 200 (+100% vs 100 avg),
          // transport 210 (~+5% vs 200 avg).
          "2025-04": makeMonthlyEntry({ expensesByCategory: { "cat-food": 200, "cat-transport": 210 } }),
        },
      })
    );

    const result = calculateCategoryAnomaly({
      report,
      selectedMonths: ["2025-04"],
      categories,
      referenceMonths: WINDOW,
    });

    expect(result?.name).toBe("Restaurantes");
    // The trailing-window baseline includes April: (100+100+100+200)/4 = 125;
    // period avg = 200 → (200−125)/125 = +60%.
    expect(result?.twelveMonthAverage).toBe(125);
    expect(result?.periodAverage).toBe(200);
    expect(result?.deviationPercent).toBe(60);
  });

  it("ignores categories below the baseline threshold to avoid percentage noise", () => {
    const categories = [makeCategory({ id: "cat-tiny", name: "Pequeno" })];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expensesByCategory: { "cat-tiny": 2 } }),
          "2025-04": makeMonthlyEntry({ expensesByCategory: { "cat-tiny": 20 } }),
        },
      })
    );

    const result = calculateCategoryAnomaly({
      report,
      selectedMonths: ["2025-04"],
      categories,
      referenceMonths: WINDOW,
    });

    // baseline avg = 2/4 = 0.5 < 50 → filtered out.
    expect(result).toBeNull();
  });

  it("skips positive-expense categories", () => {
    const categories = [makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true })];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expensesByCategory: { "cat-invest": 1000 } }),
          "2025-04": makeMonthlyEntry({ expensesByCategory: { "cat-invest": 5000 } }),
        },
      })
    );

    const result = calculateCategoryAnomaly({
      report,
      selectedMonths: ["2025-04"],
      categories,
      referenceMonths: WINDOW,
    });

    expect(result).toBeNull();
  });
});
