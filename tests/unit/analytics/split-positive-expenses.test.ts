import { describe, it, expect } from "vitest";
import { makeCategory, makeMonthlyEntry } from "../../helpers";
import { splitPositiveExpenses } from "~/services/analytics/split-positive-expenses";

describe("splitPositiveExpenses", () => {
  it("returns zero positive expenses when no category has the flag", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-transport", name: "Transporte" }),
    ];

    const entry = makeMonthlyEntry({
      expenses: 800,
      expensesByCategory: { "cat-food": 500, "cat-transport": 300 },
    });

    const result = splitPositiveExpenses({ entry, categories });

    expect(result).toEqual({
      rawExpenses: 800,
      positiveExpenses: 0,
      realExpenses: 800,
    });
  });

  it("separates positive-expense categories from the real total", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
    ];

    const entry = makeMonthlyEntry({
      expenses: 1500,
      expensesByCategory: { "cat-food": 1000, "cat-invest": 500 },
    });

    const result = splitPositiveExpenses({ entry, categories });

    expect(result).toEqual({
      rawExpenses: 1500,
      positiveExpenses: 500,
      realExpenses: 1000,
    });
  });

  it("sums multiple positive-expense categories", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
      makeCategory({ id: "cat-savings", name: "Poupança", isPositiveExpense: true }),
    ];

    const entry = makeMonthlyEntry({
      expenses: 2000,
      expensesByCategory: { "cat-food": 800, "cat-invest": 700, "cat-savings": 500 },
    });

    const result = splitPositiveExpenses({ entry, categories });

    expect(result.positiveExpenses).toBe(1200);
    expect(result.realExpenses).toBe(800);
  });

  it("ignores positive-expense category ids that aren't present in the entry", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
    ];

    const entry = makeMonthlyEntry({
      expenses: 500,
      expensesByCategory: { "cat-food": 500 },
    });

    const result = splitPositiveExpenses({ entry, categories });

    expect(result.positiveExpenses).toBe(0);
    expect(result.realExpenses).toBe(500);
  });

  it("clamps realExpenses to 0 when multi-category double-counting inflates the positive bucket", () => {
    // Edge case protecting against the pre-existing multi-category
    // double-counting bug (see
    // docs/observations/reports/bug/2026-04-05-multi-category-transactions-double-counted-in-breakdown.md):
    // a single R$ 500 transaction with ids ["cat-invest", "cat-food"] adds 500
    // to both buckets but only 500 to `expenses`, so the positive bucket can
    // exceed rawExpenses. Without the clamp, realExpenses would go negative.
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
    ];

    const entry = makeMonthlyEntry({
      expenses: 500,
      expensesByCategory: { "cat-food": 500, "cat-invest": 500 },
    });

    const result = splitPositiveExpenses({ entry, categories });

    expect(result.rawExpenses).toBe(500);
    expect(result.positiveExpenses).toBe(500);
    expect(result.realExpenses).toBe(0);
  });

  it("handles an empty expensesByCategory map", () => {
    const categories = [
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
    ];

    const entry = makeMonthlyEntry({ expenses: 0, expensesByCategory: {} });

    const result = splitPositiveExpenses({ entry, categories });

    expect(result).toEqual({
      rawExpenses: 0,
      positiveExpenses: 0,
      realExpenses: 0,
    });
  });
});
