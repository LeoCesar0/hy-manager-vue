import { describe, it, expect } from "vitest";
import { zReportBase } from "~/@schemas/models/report";

describe("enriched report schema — backward compatibility", () => {
  it("parses old monthlyBreakdown shape with .default({}) filling enriched fields", () => {
    const result = zReportBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      totalIncome: 1000,
      totalExpenses: 500,
      transactionCount: 5,
      expensesByCategory: {},
      depositsByCategory: {},
      expensesByCounterparty: {},
      depositsByCounterparty: {},
      monthlyBreakdown: {
        "2024-01": { income: 500, expenses: 200 },
        "2024-02": { income: 500, expenses: 300 },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const jan = result.data.monthlyBreakdown["2024-01"]!;
      expect(jan.income).toBe(500);
      expect(jan.expenses).toBe(200);
      expect(jan.expensesByCategory).toEqual({});
      expect(jan.depositsByCategory).toEqual({});
      expect(jan.expensesByCounterparty).toEqual({});
      expect(jan.depositsByCounterparty).toEqual({});
    }
  });

  it("parses new monthlyBreakdown shape with enriched fields", () => {
    const result = zReportBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      totalIncome: 1000,
      totalExpenses: 500,
      transactionCount: 5,
      expensesByCategory: { "cat-1": 500 },
      depositsByCategory: { "cat-2": 1000 },
      expensesByCounterparty: {},
      depositsByCounterparty: {},
      monthlyBreakdown: {
        "2024-01": {
          income: 1000,
          expenses: 500,
          expensesByCategory: { "cat-1": 500 },
          depositsByCategory: { "cat-2": 1000 },
          expensesByCounterparty: { "cp-1": 500 },
          depositsByCounterparty: { "cp-2": 1000 },
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const jan = result.data.monthlyBreakdown["2024-01"]!;
      expect(jan.expensesByCategory).toEqual({ "cat-1": 500 });
      expect(jan.depositsByCounterparty).toEqual({ "cp-2": 1000 });
    }
  });
});
