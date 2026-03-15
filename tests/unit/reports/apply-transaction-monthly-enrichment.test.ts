import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeTransaction, makeReport, makeMonthlyEntry } from "../../helpers";
import { applyTransactionToReport } from "~/services/api/reports/apply-transaction-to-report";

const makeDate = (year: number, month: number) =>
  Timestamp.fromDate(new Date(year, month - 1, 15));

describe("applyTransactionToReport — monthly enrichment", () => {
  it("populates month-level expensesByCategory for expense transactions", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "expense",
      amount: 250,
      date: makeDate(2024, 6),
      categoryIds: ["cat-food", "cat-transport"],
      counterpartyId: null,
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });
    const monthEntry = result.monthlyBreakdown["2024-06"]!;

    expect(monthEntry.expensesByCategory).toEqual({ "cat-food": 250, "cat-transport": 250 });
    expect(monthEntry.depositsByCategory).toEqual({});
  });

  it("populates month-level depositsByCategory for deposit transactions", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "deposit",
      amount: 500,
      date: makeDate(2024, 3),
      categoryIds: ["cat-salary"],
      counterpartyId: null,
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });
    const monthEntry = result.monthlyBreakdown["2024-03"]!;

    expect(monthEntry.depositsByCategory).toEqual({ "cat-salary": 500 });
    expect(monthEntry.expensesByCategory).toEqual({});
  });

  it("populates month-level expensesByCounterparty", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "expense",
      amount: 100,
      date: makeDate(2024, 4),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-supermarket",
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });
    const monthEntry = result.monthlyBreakdown["2024-04"]!;

    expect(monthEntry.expensesByCounterparty).toEqual({ "cp-supermarket": 100 });
    expect(monthEntry.depositsByCounterparty).toEqual({});
  });

  it("populates month-level depositsByCounterparty", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "deposit",
      amount: 3000,
      date: makeDate(2024, 7),
      categoryIds: [],
      counterpartyId: "cp-employer",
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });
    const monthEntry = result.monthlyBreakdown["2024-07"]!;

    expect(monthEntry.depositsByCounterparty).toEqual({ "cp-employer": 3000 });
    expect(monthEntry.expensesByCounterparty).toEqual({});
  });

  it("accumulates values across multiple transactions in the same month", () => {
    const report = makeReport();

    const tx1 = makeTransaction({
      type: "expense",
      amount: 100,
      date: makeDate(2024, 1),
      categoryIds: ["cat-food"],
      counterpartyId: "cp-1",
    });
    const tx2 = makeTransaction({
      type: "expense",
      amount: 200,
      date: makeDate(2024, 1),
      categoryIds: ["cat-food"],
      counterpartyId: "cp-1",
    });
    const tx3 = makeTransaction({
      type: "expense",
      amount: 50,
      date: makeDate(2024, 1),
      categoryIds: ["cat-transport"],
      counterpartyId: "cp-2",
    });

    const r1 = applyTransactionToReport({ report, transaction: tx1, direction: 1 });
    const r2 = applyTransactionToReport({ report: r1, transaction: tx2, direction: 1 });
    const r3 = applyTransactionToReport({ report: r2, transaction: tx3, direction: 1 });

    const monthEntry = r3.monthlyBreakdown["2024-01"]!;

    expect(monthEntry.expensesByCategory).toEqual({ "cat-food": 300, "cat-transport": 50 });
    expect(monthEntry.expensesByCounterparty).toEqual({ "cp-1": 300, "cp-2": 50 });
    expect(monthEntry.expenses).toBe(350);
  });

  it("direction -1 decrements month-level enriched fields", () => {
    const report = makeReport({
      totalExpenses: 500,
      transactionCount: 2,
      expensesByCategory: { "cat-1": 500 },
      expensesByCounterparty: { "cp-1": 500 },
      monthlyBreakdown: {
        "2024-02": makeMonthlyEntry({
          expenses: 500,
          expensesByCategory: { "cat-1": 500 },
          expensesByCounterparty: { "cp-1": 500 },
        }),
      },
    });

    const transaction = makeTransaction({
      type: "expense",
      amount: 200,
      date: makeDate(2024, 2),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
    });

    const result = applyTransactionToReport({ report, transaction, direction: -1 });
    const monthEntry = result.monthlyBreakdown["2024-02"]!;

    expect(monthEntry.expenses).toBe(300);
    expect(monthEntry.expensesByCategory).toEqual({ "cat-1": 300 });
    expect(monthEntry.expensesByCounterparty).toEqual({ "cp-1": 300 });
  });

  it("removes month-level category/counterparty entries when value reaches 0", () => {
    const report = makeReport({
      totalExpenses: 100,
      transactionCount: 1,
      expensesByCategory: { "cat-1": 100 },
      expensesByCounterparty: { "cp-1": 100 },
      monthlyBreakdown: {
        "2024-05": makeMonthlyEntry({
          expenses: 100,
          expensesByCategory: { "cat-1": 100 },
          expensesByCounterparty: { "cp-1": 100 },
        }),
      },
    });

    const transaction = makeTransaction({
      type: "expense",
      amount: 100,
      date: makeDate(2024, 5),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
    });

    const result = applyTransactionToReport({ report, transaction, direction: -1 });
    const monthEntry = result.monthlyBreakdown["2024-05"]!;

    expect(monthEntry.expensesByCategory).toEqual({});
    expect(monthEntry.expensesByCounterparty).toEqual({});
  });

  it("skips month-level counterparty update when counterpartyId is null", () => {
    const report = makeReport();
    const transaction = makeTransaction({
      type: "expense",
      amount: 75,
      date: makeDate(2024, 8),
      categoryIds: ["cat-1"],
      counterpartyId: null,
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });
    const monthEntry = result.monthlyBreakdown["2024-08"]!;

    expect(monthEntry.expensesByCounterparty).toEqual({});
    expect(monthEntry.expensesByCategory).toEqual({ "cat-1": 75 });
  });

  it("handles transactions across different months independently", () => {
    const report = makeReport();

    const txJan = makeTransaction({
      type: "expense",
      amount: 100,
      date: makeDate(2024, 1),
      categoryIds: ["cat-food"],
    });
    const txFeb = makeTransaction({
      type: "expense",
      amount: 200,
      date: makeDate(2024, 2),
      categoryIds: ["cat-food"],
    });

    const r1 = applyTransactionToReport({ report, transaction: txJan, direction: 1 });
    const r2 = applyTransactionToReport({ report: r1, transaction: txFeb, direction: 1 });

    expect(r2.monthlyBreakdown["2024-01"]!.expensesByCategory).toEqual({ "cat-food": 100 });
    expect(r2.monthlyBreakdown["2024-02"]!.expensesByCategory).toEqual({ "cat-food": 200 });
  });

  it("handles backward-compatible month entries (missing enriched fields)", () => {
    const report = makeReport({
      monthlyBreakdown: {
        // Simulates a pre-enrichment monthly entry (no category/counterparty maps)
        "2024-01": { income: 100, expenses: 50 } as any,
      },
    });

    const transaction = makeTransaction({
      type: "expense",
      amount: 30,
      date: makeDate(2024, 1),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
    });

    const result = applyTransactionToReport({ report, transaction, direction: 1 });
    const monthEntry = result.monthlyBreakdown["2024-01"]!;

    expect(monthEntry.expenses).toBe(80);
    expect(monthEntry.income).toBe(100);
    expect(monthEntry.expensesByCategory).toEqual({ "cat-1": 30 });
    expect(monthEntry.expensesByCounterparty).toEqual({ "cp-1": 30 });
  });
});
