import { describe, it, expect } from "vitest";
import { makeReport } from "../../helpers";
import { removeCategoryFromReport } from "~/services/api/sync/remove-category-from-report";

describe("removeCategoryFromReport", () => {
  it("removes categoryId from expensesByCategory and depositsByCategory", () => {
    const report = makeReport({
      expensesByCategory: { "cat-1": 100, "cat-2": 200 },
      depositsByCategory: { "cat-1": 50, "cat-3": 300 },
    });

    const result = removeCategoryFromReport({ categoryId: "cat-1", report });

    expect(result.expensesByCategory).toEqual({ "cat-2": 200 });
    expect(result.depositsByCategory).toEqual({ "cat-3": 300 });
  });

  it("returns report unchanged when categoryId not found", () => {
    const report = makeReport({
      expensesByCategory: { "cat-2": 200 },
      depositsByCategory: { "cat-3": 300 },
    });

    const result = removeCategoryFromReport({ categoryId: "cat-1", report });

    expect(result.expensesByCategory).toEqual({ "cat-2": 200 });
    expect(result.depositsByCategory).toEqual({ "cat-3": 300 });
  });

  it("handles empty category maps", () => {
    const report = makeReport();

    const result = removeCategoryFromReport({ categoryId: "cat-1", report });

    expect(result.expensesByCategory).toEqual({});
    expect(result.depositsByCategory).toEqual({});
  });

  it("does not mutate the original report", () => {
    const report = makeReport({
      expensesByCategory: { "cat-1": 100 },
    });

    removeCategoryFromReport({ categoryId: "cat-1", report });

    expect(report.expensesByCategory).toEqual({ "cat-1": 100 });
  });

  it("preserves all other report fields", () => {
    const report = makeReport({
      totalIncome: 500,
      totalExpenses: 300,
      transactionCount: 10,
      expensesByCategory: { "cat-1": 100 },
      expensesByCounterparty: { "cp-1": 100 },
      monthlyBreakdown: { "2024-01": { income: 500, expenses: 300 } },
    });

    const result = removeCategoryFromReport({ categoryId: "cat-1", report });

    expect(result.totalIncome).toBe(500);
    expect(result.totalExpenses).toBe(300);
    expect(result.transactionCount).toBe(10);
    expect(result.expensesByCounterparty).toEqual({ "cp-1": 100 });
    expect(result.monthlyBreakdown).toEqual({ "2024-01": { income: 500, expenses: 300 } });
  });
});
