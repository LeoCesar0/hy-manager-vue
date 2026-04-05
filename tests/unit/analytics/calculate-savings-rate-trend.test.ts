import { describe, it, expect } from "vitest";
import { makeMonthlyEntry } from "../../helpers";
import { calculateSavingsRateTrend } from "~/services/analytics/calculate-savings-rate-trend";

describe("calculateSavingsRateTrend", () => {
  it("computes savings rate as (income - expenses) / income per month", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 800 }),
        "2025-02": makeMonthlyEntry({ income: 2000, expenses: 500 }),
      },
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
    });

    expect(result[0]?.savingsRate).toBe(-0.5);
  });

  it("returns 0 for months with zero income", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 0, expenses: 200 }),
      },
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
    });

    expect(result.map((p) => p.label)).toEqual(["01/2025", "02/2025", "03/2025"]);
  });

  it("fills missing months with zeros", () => {
    const result = calculateSavingsRateTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 500 }),
      },
    });

    expect(result[1]).toEqual({
      label: "02/2025",
      savingsRate: 0,
      income: 0,
      expenses: 0,
    });
  });
});
