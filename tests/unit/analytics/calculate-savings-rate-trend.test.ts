import { describe, it, expect } from "vitest";
import { makeCategory, makeMonthlyEntry } from "../../helpers";
import { calculateSavingsRateTrend } from "~/services/analytics/calculate-savings-rate-trend";

describe("calculateSavingsRateTrend", () => {
  it("computes savings rate as (income - expenses) / income per month", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 800 }),
        "2025-02": makeMonthlyEntry({ income: 2000, expenses: 500 }),
      },
      categories: [],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      label: "01/2025",
      savingsRate: 0.2,
      income: 1000,
      expenses: 800,
    });
    expect(result[1]).toEqual({
      label: "02/2025",
      savingsRate: 0.75,
      income: 2000,
      expenses: 500,
    });
  });

  it("returns negative rate when expenses exceed income", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 1500 }),
      },
      categories: [],
    });

    expect(result[0]?.savingsRate).toBe(-0.5);
  });

  it("returns 0 for months with zero income", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 0, expenses: 200 }),
      },
      categories: [],
    });

    expect(result[0]?.savingsRate).toBe(0);
  });

  it("sorts monthKeys chronologically regardless of input order", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-03", "2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 100, expenses: 50 }),
        "2025-02": makeMonthlyEntry({ income: 100, expenses: 50 }),
        "2025-03": makeMonthlyEntry({ income: 100, expenses: 50 }),
      },
      categories: [],
    });

    expect(result.map((p) => p.label)).toEqual(["01/2025", "02/2025", "03/2025"]);
  });

  it("fills missing months with zeros", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 500 }),
      },
      categories: [],
    });

    expect(result[1]).toEqual({
      label: "02/2025",
      savingsRate: 0,
      income: 0,
      expenses: 0,
    });
  });

  it("excludes positive-expense categories from the rate", () => {
    // Without the positive-expense split, investing R$ 400 of a R$ 1000
    // paycheck (alongside R$ 300 of real spending) would report a savings
    // rate of 30%. But investing *is* saving — the real rate is 70%.
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
    ];

    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          income: 1000,
          expenses: 700,
          expensesByCategory: { "cat-food": 300, "cat-invest": 400 },
        }),
      },
      categories,
    });

    // (1000 - 300) / 1000 = 0.7, not (1000 - 700) / 1000 = 0.3
    expect(result[0]?.savingsRate).toBeCloseTo(0.7, 4);
    expect(result[0]?.expenses).toBe(300);
  });
});
