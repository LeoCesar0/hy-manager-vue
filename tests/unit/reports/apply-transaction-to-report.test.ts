import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeTransaction, makeReport, makeMonthlyEntry } from "../../helpers";
import { applyTransactionToReport } from "~/services/api/reports/apply-transaction-to-report";

const makeDate = (year: number, month: number) =>
  Timestamp.fromDate(new Date(year, month - 1, 15));

describe("applyTransactionToReport", () => {
  it("expense transaction increments totalExpenses, monthlyBreakdown, and expensesByCounterparty", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "expense",
      amount: 150,
      date: makeDate(2024, 3),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });

    expect(result.totalExpenses).toBe(150);
    expect(result.totalIncome).toBe(0);
    expect(result.expensesByCategory).toEqual({ "cat-1": 150 });
    expect(result.expensesByCounterparty).toEqual({ "cp-1": 150 });
    expect(result.monthlyBreakdown["2024-03"]).toEqual(
      makeMonthlyEntry({
        expenses: 150,
        transactionCount: 1,
        expensesByCategory: { "cat-1": 150 },
        expensesByCounterparty: { "cp-1": 150 },
        expensesByCategoryAndCounterparty: { "cat-1": { "cp-1": 150 } },
        expensesByCategoryCount: { "cat-1": 1 },
        expensesByCounterpartyCount: { "cp-1": 1 },
      })
    );
    expect(result.transactionCount).toBe(1);
  });

  it("deposit transaction increments totalIncome, depositsByCategory, and depositsByCounterparty", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "deposit",
      amount: 200,
      date: makeDate(2024, 5),
      categoryIds: ["cat-2"],
      counterpartyId: "cp-2",
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });

    expect(result.totalIncome).toBe(200);
    expect(result.totalExpenses).toBe(0);
    expect(result.depositsByCategory).toEqual({ "cat-2": 200 });
    expect(result.depositsByCounterparty).toEqual({ "cp-2": 200 });
    expect(result.monthlyBreakdown["2024-05"]).toEqual(
      makeMonthlyEntry({
        income: 200,
        transactionCount: 1,
        depositsByCategory: { "cat-2": 200 },
        depositsByCounterparty: { "cp-2": 200 },
        depositsByCategoryAndCounterparty: { "cat-2": { "cp-2": 200 } },
        depositsByCategoryCount: { "cat-2": 1 },
        depositsByCounterpartyCount: { "cp-2": 1 },
      })
    );
  });

  it("transaction with empty categoryIds does NOT add to expensesByCategory but DOES add to totalExpenses", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "expense",
      amount: 75,
      date: makeDate(2024, 1),
      categoryIds: [],
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });

    expect(result.totalExpenses).toBe(75);
    expect(result.expensesByCategory).toEqual({});
  });

  it("transaction with multiple categoryIds adds full amount to EACH category", () => {
    // Each category receives the full transaction amount — a R$100 expense
    // tagged with Mercado + Lazer means R$100 in Mercado AND R$100 in Lazer.
    // This is intentional: per-category views show the full impact on each
    // category. sum(expensesByCategory) can exceed totalExpenses; consumers
    // that need the scalar total use entry.expenses directly.
    const report = makeReport();
    const transaction = makeTransaction({
      type: "expense",
      amount: 100,
      date: makeDate(2024, 2),
      categoryIds: ["cat-a", "cat-b", "cat-c"],
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });

    expect(result.totalExpenses).toBe(100);
    expect(result.expensesByCategory).toEqual({
      "cat-a": 100,
      "cat-b": 100,
      "cat-c": 100,
    });
  });

  it("direction -1 decrements values (delete scenario)", () => {
    const report = makeReport({
      totalExpenses: 300,
      transactionCount: 3,
      expensesByCategory: { "cat-1": 300 },
      expensesByCounterparty: { "cp-1": 300 },
      monthlyBreakdown: {
        "2024-06": makeMonthlyEntry({
          expenses: 300,
          transactionCount: 3,
          expensesByCategory: { "cat-1": 300 },
          expensesByCounterparty: { "cp-1": 300 },
          expensesByCategoryAndCounterparty: { "cat-1": { "cp-1": 300 } },
          expensesByCategoryCount: { "cat-1": 3 },
          expensesByCounterpartyCount: { "cp-1": 3 },
        }),
      },
    });

    const transaction = makeTransaction({
      type: "expense",
      amount: 100,
      date: makeDate(2024, 6),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
    });

    const result = applyTransactionToReport({ report, transaction, direction: -1 });

    expect(result.totalExpenses).toBe(200);
    expect(result.transactionCount).toBe(2);
    expect(result.expensesByCategory).toEqual({ "cat-1": 200 });
    expect(result.expensesByCounterparty).toEqual({ "cp-1": 200 });
    expect(result.monthlyBreakdown["2024-06"]).toEqual(
      makeMonthlyEntry({
        expenses: 200,
        transactionCount: 2,
        expensesByCategory: { "cat-1": 200 },
        expensesByCounterparty: { "cp-1": 200 },
        expensesByCategoryAndCounterparty: { "cat-1": { "cp-1": 200 } },
        expensesByCategoryCount: { "cat-1": 2 },
        expensesByCounterpartyCount: { "cp-1": 2 },
      })
    );
  });

  it("values never go below 0 (Math.max(0, ...) guard)", () => {
    const report = makeReport({
      totalExpenses: 50,
      transactionCount: 1,
      expensesByCategory: { "cat-1": 50 },
      expensesByCounterparty: { "cp-1": 50 },
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({
          expenses: 50,
          transactionCount: 1,
          expensesByCategory: { "cat-1": 50 },
          expensesByCounterparty: { "cp-1": 50 },
          expensesByCategoryAndCounterparty: { "cat-1": { "cp-1": 50 } },
          expensesByCategoryCount: { "cat-1": 1 },
          expensesByCounterpartyCount: { "cp-1": 1 },
        }),
      },
    });

    const transaction = makeTransaction({
      type: "expense",
      amount: 200,
      date: makeDate(2024, 1),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
    });

    const result = applyTransactionToReport({ report, transaction, direction: -1 });

    expect(result.totalExpenses).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.expensesByCategory).toEqual({});
    expect(result.expensesByCounterparty).toEqual({});
    expect(result.monthlyBreakdown["2024-01"]).toEqual(makeMonthlyEntry());
  });

  it("transaction without counterpartyId skips counterparty map update", () => {
    const report = makeReport({
      expensesByCounterparty: { "cp-1": 100 },
    });

    const transaction = makeTransaction({
      type: "expense",
      amount: 50,
      date: makeDate(2024, 4),
      categoryIds: ["cat-1"],
      counterpartyId: null,
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });

    expect(result.expensesByCounterparty).toEqual({ "cp-1": 100 });
  });

  it("transactionCount increments and decrements correctly", () => {
    const report = makeReport({ transactionCount: 5 });
    const transaction = makeTransaction({ date: makeDate(2024, 1) });

    const afterAdd = applyTransactionToReport({ report, transaction, direction: 1 });
    expect(afterAdd.transactionCount).toBe(6);

    const afterRemove = applyTransactionToReport({ report: afterAdd, transaction, direction: -1 });
    expect(afterRemove.transactionCount).toBe(5);
  });

  it("does not mutate the original report", () => {
    const report = makeReport({ totalExpenses: 100, transactionCount: 1 });
    const transaction = makeTransaction({
      type: "expense",
      amount: 50,
      date: makeDate(2024, 1),
      categoryIds: ["cat-1"],
    });

    applyTransactionToReport({ report, transaction, direction: 1 });

    expect(report.totalExpenses).toBe(100);
    expect(report.transactionCount).toBe(1);
  });
});
