import { describe, it, expect } from "vitest";
import { makeCategory, makeMonthlyEntry } from "../../helpers";
import { calculateBalanceTrend } from "~/services/analytics/calculate-balance-trend";

describe("calculateBalanceTrend", () => {
  it("computes balance as income - rawExpenses per month", () => {
    const result = calculateBalanceTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 5000, expenses: 3000 }),
        "2025-02": makeMonthlyEntry({ income: 6000, expenses: 4500 }),
      },
      categories: [],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ label: "01/2025", balance: 2000 });
    expect(result[1]).toMatchObject({ label: "02/2025", balance: 1500 });
  });

  it("computes ratio as realExpenses / income (excluding positive-expense categories)", () => {
    // R$ 1000 income, 300 real expenses + 400 investments. Raw ratio would
    // be 700/1000 = 0.7 — but the "Proporção Saídas/Entradas" chart should
    // answer "how much of your income went to actual spending?" which is
    // 300/1000 = 0.3.
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
    ];

    const result = calculateBalanceTrend({
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

    expect(result[0]?.ratio).toBeCloseTo(0.3, 4);
    // Balance stays raw — it's money that actually left the operating
    // account, investments included.
    expect(result[0]?.balance).toBe(300);
  });

  it("returns ratio 0 when income is 0", () => {
    const result = calculateBalanceTrend({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 0, expenses: 500 }),
      },
      categories: [],
    });

    expect(result[0]?.ratio).toBe(0);
    expect(result[0]?.balance).toBe(-500);
  });

  it("sorts monthKeys chronologically regardless of input order", () => {
    const result = calculateBalanceTrend({
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
    const result = calculateBalanceTrend({
      monthKeys: ["2025-01", "2025-02"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({ income: 1000, expenses: 500 }),
      },
      categories: [],
    });

    expect(result[1]).toMatchObject({ label: "02/2025", balance: 0, ratio: 0 });
  });
});
