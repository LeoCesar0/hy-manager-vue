import { describe, it, expect } from "vitest";
import { makeMonthlyEntry } from "../../helpers";
import { calculateCumulativeBalanceTrend } from "~/services/analytics/calculate-cumulative-balance-trend";

describe("calculateCumulativeBalanceTrend", () => {
  it("accumulates (income - expenses) across months in chronological order", () => {
    const result = calculateCumulativeBalanceTrend({
      monthKeys: ["2025-01", "2025-02", "2025-03"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 800 }),
        "2025-02": makeMonthlyEntry({ income: 1000, expenses: 600 }),
        "2025-03": makeMonthlyEntry({ income: 1000, expenses: 1200 }),
      },
    });

    expect(result).toEqual([
      { label: "01/2025", monthBalance: 200, cumulative: 200 },
      { label: "02/2025", monthBalance: 400, cumulative: 600 },
      { label: "03/2025", monthBalance: -200, cumulative: 400 },
    ]);
  });

  it("sorts monthKeys chronologically regardless of input order", () => {
    const result = calculateCumulativeBalanceTrend({
      monthKeys: ["2025-03", "2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 100, expenses: 50 }),
        "2025-02": makeMonthlyEntry({ income: 100, expenses: 50 }),
        "2025-03": makeMonthlyEntry({ income: 100, expenses: 50 }),
      },
    });

    expect(result.map((p) => p.label)).toEqual(["01/2025", "02/2025", "03/2025"]);
    expect(result[2]?.cumulative).toBe(150);
  });

  it("handles empty monthKeys", () => {
    const result = calculateCumulativeBalanceTrend({
      monthKeys: [],
      monthlyBreakdown: {},
    });
    expect(result).toEqual([]);
  });

  it("treats missing months as zero-balance months", () => {
    const result = calculateCumulativeBalanceTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 500, expenses: 200 }),
      },
    });

    expect(result[0]?.cumulative).toBe(300);
    expect(result[1]?.cumulative).toBe(300);
    expect(result[1]?.monthBalance).toBe(0);
  });
});
