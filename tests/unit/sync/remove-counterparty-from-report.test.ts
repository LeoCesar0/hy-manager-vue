import { describe, it, expect } from "vitest";
import { makeReport } from "../../helpers";
import { removeCounterpartyFromReport } from "~/services/api/sync/remove-counterparty-from-report";

describe("removeCounterpartyFromReport", () => {
  it("removes counterpartyId from expensesByCounterparty and depositsByCounterparty", () => {
    const report = makeReport({
      expensesByCounterparty: { "cp-1": 100, "cp-2": 200 },
      depositsByCounterparty: { "cp-1": 50, "cp-3": 300 },
    });

    const result = removeCounterpartyFromReport({ counterpartyId: "cp-1", report });

    expect(result.expensesByCounterparty).toEqual({ "cp-2": 200 });
    expect(result.depositsByCounterparty).toEqual({ "cp-3": 300 });
  });

  it("returns report unchanged when counterpartyId not found", () => {
    const report = makeReport({
      expensesByCounterparty: { "cp-2": 200 },
      depositsByCounterparty: { "cp-3": 300 },
    });

    const result = removeCounterpartyFromReport({ counterpartyId: "cp-1", report });

    expect(result.expensesByCounterparty).toEqual({ "cp-2": 200 });
    expect(result.depositsByCounterparty).toEqual({ "cp-3": 300 });
  });

  it("handles empty counterparty maps", () => {
    const report = makeReport();

    const result = removeCounterpartyFromReport({ counterpartyId: "cp-1", report });

    expect(result.expensesByCounterparty).toEqual({});
    expect(result.depositsByCounterparty).toEqual({});
  });

  it("does not mutate the original report", () => {
    const report = makeReport({
      expensesByCounterparty: { "cp-1": 100 },
    });

    removeCounterpartyFromReport({ counterpartyId: "cp-1", report });

    expect(report.expensesByCounterparty).toEqual({ "cp-1": 100 });
  });

  it("preserves all other report fields", () => {
    const report = makeReport({
      totalIncome: 500,
      totalExpenses: 300,
      transactionCount: 10,
      expensesByCounterparty: { "cp-1": 100 },
      expensesByCategory: { "cat-1": 100 },
      monthlyBreakdown: { "2024-01": { income: 500, expenses: 300 } },
    });

    const result = removeCounterpartyFromReport({ counterpartyId: "cp-1", report });

    expect(result.totalIncome).toBe(500);
    expect(result.totalExpenses).toBe(300);
    expect(result.transactionCount).toBe(10);
    expect(result.expensesByCategory).toEqual({ "cat-1": 100 });
    expect(result.monthlyBreakdown).toEqual({ "2024-01": { income: 500, expenses: 300 } });
  });
});
