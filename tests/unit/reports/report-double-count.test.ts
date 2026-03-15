import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeTransaction, makeReport } from "../../helpers";
import { applyTransactionToReport } from "~/services/api/reports/apply-transaction-to-report";

const makeDate = (year: number, month: number) =>
  Timestamp.fromDate(new Date(year, month - 1, 15));

describe("report double-counting bug", () => {
  it("demonstrates double-counting: rebuildReport + late updateReportBulk doubles totals", () => {
    const transactions = [
      makeTransaction({ type: "expense", amount: 100, date: makeDate(2024, 1), categoryIds: ["cat-1"], counterpartyId: "cp-1" }),
      makeTransaction({ type: "expense", amount: 200, date: makeDate(2024, 1), categoryIds: ["cat-1"], counterpartyId: "cp-1" }),
      makeTransaction({ type: "expense", amount: 150, date: makeDate(2024, 2), categoryIds: ["cat-2"], counterpartyId: "cp-2" }),
      makeTransaction({ type: "deposit", amount: 500, date: makeDate(2024, 1), categoryIds: ["cat-3"], counterpartyId: "cp-3" }),
      makeTransaction({ type: "expense", amount: 50, date: makeDate(2024, 2), categoryIds: ["cat-1"], counterpartyId: null }),
    ];

    // Step 1: rebuildReport — build from scratch (correct result)
    const emptyReport = makeReport();
    const rebuilt = transactions.reduce(
      (report, tx) => applyTransactionToReport({ report, transaction: tx, direction: 1 }),
      emptyReport
    );

    expect(rebuilt.totalExpenses).toBe(500);
    expect(rebuilt.totalIncome).toBe(500);
    expect(rebuilt.transactionCount).toBe(5);

    // Step 2: late updateReportBulk fires — applies same transactions ON TOP of rebuilt report
    const doubled = transactions.reduce(
      (report, tx) => applyTransactionToReport({ report, transaction: tx, direction: 1 }),
      rebuilt
    );

    // Totals are now doubled — this is the bug
    expect(doubled.totalExpenses).toBe(1000);
    expect(doubled.totalIncome).toBe(1000);
    expect(doubled.transactionCount).toBe(10);

    // The fix: awaiting updateReportBulk prevents it from running after rebuildReport
    // has already recalculated from all transactions
  });

  it("correct behavior: rebuild from scratch produces accurate totals", () => {
    const transactions = [
      makeTransaction({ type: "expense", amount: 100, date: makeDate(2024, 3), categoryIds: ["cat-1"] }),
      makeTransaction({ type: "expense", amount: 200, date: makeDate(2024, 3), categoryIds: ["cat-1"] }),
      makeTransaction({ type: "deposit", amount: 1000, date: makeDate(2024, 3), categoryIds: ["cat-2"] }),
    ];

    const emptyReport = makeReport();
    const rebuilt = transactions.reduce(
      (report, tx) => applyTransactionToReport({ report, transaction: tx, direction: 1 }),
      emptyReport
    );

    expect(rebuilt.totalExpenses).toBe(300);
    expect(rebuilt.totalIncome).toBe(1000);
    expect(rebuilt.transactionCount).toBe(3);
    expect(rebuilt.monthlyBreakdown["2024-03"]).toEqual({
      income: 1000, expenses: 300,
      expensesByCategory: { "cat-1": 300 }, depositsByCategory: { "cat-2": 1000 },
      expensesByCounterparty: {}, depositsByCounterparty: {},
    });
  });
});
