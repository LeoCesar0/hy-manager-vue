import { describe, it, expect } from "vitest";
import { makeCategory, makeMonthlyEntry, makeReport } from "../../helpers";
import {
  buildCategoryDrillDown,
} from "~/services/analytics/build-category-drill-down";
import type { IReport } from "~/@schemas/models/report";

// Upcasts IReportBase → IReport for test purposes. The drill-down builder only
// reads the report shape, not the Firestore commonDoc fields, so this cast is safe.
const asReport = (r: ReturnType<typeof makeReport>): IReport => r as IReport;

describe("buildCategoryDrillDown", () => {
  const categories = [
    makeCategory({ id: "cat-food", name: "Alimentação" }),
    makeCategory({ id: "cat-salary", name: "Salário" }),
  ];

  const report = asReport(
    makeReport({
      totalIncome: 1000,
      totalExpenses: 800,
      expensesByCategory: { "cat-food": 200, "cat-salary": 0 },
      depositsByCategory: { "cat-food": 0, "cat-salary": 750 },
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          income: 500,
          expenses: 400,
          expensesByCategory: { "cat-food": 100 },
          depositsByCategory: { "cat-salary": 375 },
        }),
        "2025-02": makeMonthlyEntry({
          income: 500,
          expenses: 400,
          expensesByCategory: { "cat-food": 100 },
          depositsByCategory: { "cat-salary": 375 },
        }),
      },
    })
  );

  it("computes monthly data for the selected category across months", () => {
    const result = buildCategoryDrillDown({
      report,
      categories,
      selectedCategoryId: "cat-food",
      monthKeys: ["2025-01", "2025-02"],
    });

    expect(result.monthlyData).toHaveLength(2);
    expect(result.monthlyData[0]).toEqual({
      label: "01/2025",
      expenses: 100,
      deposits: 0,
      total: 100,
    });
    expect(result.monthlyData[1]).toEqual({
      label: "02/2025",
      expenses: 100,
      deposits: 0,
      total: 100,
    });
  });

  it("computes percentOfExpenses correctly", () => {
    const result = buildCategoryDrillDown({
      report,
      categories,
      selectedCategoryId: "cat-food",
      monthKeys: ["2025-01", "2025-02"],
    });

    // cat-food total expense = 200, total all expenses = 800 → 25%
    expect(result.percentOfExpenses).toBe(25);
  });

  // Regression test for bug: percentOfDeposits was multiplied by 0 instead of 100,
  // causing it to always return 0 regardless of the actual category contribution.
  // Observation: docs/observations/reports/bug/2026-04-05-percent-of-deposits-multiplied-by-zero.md
  it("computes percentOfDeposits correctly (regression: was * 0)", () => {
    const result = buildCategoryDrillDown({
      report,
      categories,
      selectedCategoryId: "cat-salary",
      monthKeys: ["2025-01", "2025-02"],
    });

    // cat-salary total deposit = 750, total all income = 1000 → 75%
    expect(result.percentOfDeposits).toBe(75);
  });

  it("returns 0 for percentages when totals are zero", () => {
    const zeroReport = asReport(
      makeReport({
        totalIncome: 0,
        totalExpenses: 0,
        expensesByCategory: {},
        depositsByCategory: {},
        monthlyBreakdown: {},
      })
    );

    const result = buildCategoryDrillDown({
      report: zeroReport,
      categories,
      selectedCategoryId: "cat-food",
      monthKeys: [],
    });

    expect(result.percentOfExpenses).toBe(0);
    expect(result.percentOfDeposits).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.totalDeposit).toBe(0);
    expect(result.monthlyData).toEqual([]);
  });

  it("returns undefined item when ID doesn't match any known category", () => {
    const result = buildCategoryDrillDown({
      report,
      categories,
      selectedCategoryId: "unknown-cat",
      monthKeys: ["2025-01"],
    });

    expect(result.item).toBeUndefined();
    expect(result.monthlyData).toHaveLength(1);
  });

  it("sorts monthKeys chronologically regardless of input order", () => {
    const result = buildCategoryDrillDown({
      report,
      categories,
      selectedCategoryId: "cat-food",
      monthKeys: ["2025-02", "2025-01"],
    });

    expect(result.monthlyData[0]?.label).toBe("01/2025");
    expect(result.monthlyData[1]?.label).toBe("02/2025");
  });
});
