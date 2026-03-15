import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeTransaction, makeCategory, makeCounterparty, makeReport } from "../../helpers";
import { calculateInsights } from "~/services/analytics/calculate-insights";
import type { IReport } from "~/@schemas/models/report";
import type { ICommonDoc } from "~/@schemas/models/@common";

const makeDate = (year: number, month: number) =>
  Timestamp.fromDate(new Date(year, month - 1, 15));

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

describe("calculateInsights", () => {
  it("averageMonthlySpending = sum of monthly expenses / number of months", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": { income: 0, expenses: 100 },
          "2024-02": { income: 0, expenses: 200 },
          "2024-03": { income: 0, expenses: 300 },
        },
      })
    );

    const result = calculateInsights({
      filteredTransactions: [],
      report,
      categories: [],
      counterparties: [],
    });

    expect(result.averageMonthlySpending).toBe(200);
  });

  it("averageMonthlySpending = 0 with no report", () => {
    const result = calculateInsights({
      filteredTransactions: [],
      report: null,
      categories: [],
      counterparties: [],
    });

    expect(result.averageMonthlySpending).toBe(0);
  });

  it("monthOverMonthChange calculated correctly between last 2 months", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": { income: 0, expenses: 100 },
          "2024-02": { income: 0, expenses: 150 },
        },
      })
    );

    const result = calculateInsights({
      filteredTransactions: [],
      report,
      categories: [],
      counterparties: [],
    });

    // (150 - 100) / 100 * 100 = 50%
    expect(result.monthOverMonthChange).toBe(50);
  });

  it("monthOverMonthChange is null with only one month", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": { income: 0, expenses: 100 },
        },
      })
    );

    const result = calculateInsights({
      filteredTransactions: [],
      report,
      categories: [],
      counterparties: [],
    });

    expect(result.monthOverMonthChange).toBeNull();
  });

  it("expenseToIncomeRatio computed from filtered transactions", () => {
    const transactions = [
      makeTransaction({ type: "expense", amount: 300, date: makeDate(2024, 1) }),
      makeTransaction({ type: "deposit", amount: 1000, date: makeDate(2024, 1) }),
    ];

    const result = calculateInsights({
      filteredTransactions: transactions,
      report: null,
      categories: [],
      counterparties: [],
    });

    expect(result.expenseToIncomeRatio).toBe(0.3);
  });

  it("expenseToIncomeRatio is 0 when no income", () => {
    const transactions = [
      makeTransaction({ type: "expense", amount: 300, date: makeDate(2024, 1) }),
    ];

    const result = calculateInsights({
      filteredTransactions: transactions,
      report: null,
      categories: [],
      counterparties: [],
    });

    expect(result.expenseToIncomeRatio).toBe(0);
  });

  it("top category excludes synthetic IDs (uncategorized)", () => {
    const cat = makeCategory({ id: "cat-real", name: "Food" });
    const transactions = [
      makeTransaction({
        type: "expense",
        amount: 500,
        categoryIds: [],
        date: makeDate(2024, 1),
      }),
      makeTransaction({
        type: "expense",
        amount: 100,
        categoryIds: ["cat-real"],
        date: makeDate(2024, 1),
      }),
    ];

    const result = calculateInsights({
      filteredTransactions: transactions,
      report: null,
      categories: [cat],
      counterparties: [],
    });

    expect(result.topExpenseCategory).toEqual({ name: "Food", amount: 100 });
  });

  it("top counterparty excludes synthetic IDs (no-counterparty)", () => {
    const cp = makeCounterparty({ id: "cp-real", name: "Supermarket" });
    const transactions = [
      makeTransaction({
        type: "expense",
        amount: 500,
        counterpartyId: null,
        date: makeDate(2024, 1),
        categoryIds: [],
      }),
      makeTransaction({
        type: "expense",
        amount: 100,
        counterpartyId: "cp-real",
        date: makeDate(2024, 1),
        categoryIds: [],
      }),
    ];

    const result = calculateInsights({
      filteredTransactions: transactions,
      report: null,
      categories: [],
      counterparties: [cp],
    });

    expect(result.topExpenseCounterparty).toEqual({ name: "Supermarket", amount: 100 });
  });
});
