import { describe, it, expect } from "vitest";
import { makeMonthlyEntry } from "../../helpers";
import { aggregateMonthlyWindow } from "~/services/analytics/aggregate-monthly-window";

describe("aggregateMonthlyWindow", () => {
  describe('averaging: "fixed-window"', () => {
    it("treats months missing from the breakdown as 0 and divides by the window length", () => {
      const result = aggregateMonthlyWindow({
        monthKeys: ["2025-01", "2025-02", "2025-03", "2025-04"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expenses: 400 }),
          "2025-03": makeMonthlyEntry({ expenses: 800 }),
        },
        selectValue: (entry) => entry.expenses,
        averaging: "fixed-window",
      });

      // total 1200 over a 4-month window → average 300, not 600.
      expect(result.total).toBe(1200);
      expect(result.average).toBe(300);
      expect(result.activeMonths).toBe(2);
    });

    it("includes zero months in the median", () => {
      const result = aggregateMonthlyWindow({
        monthKeys: ["2025-01", "2025-02", "2025-03"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ income: 0 }),
          "2025-02": makeMonthlyEntry({ income: 1000 }),
          "2025-03": makeMonthlyEntry({ income: 2000 }),
        },
        selectValue: (entry) => entry.income,
        averaging: "fixed-window",
      });

      expect(result.activeMonths).toBe(2);
      expect(result.average).toBe(1000); // 3000 / 3 months
      expect(result.median).toBe(1000); // median of [0, 1000, 2000]
    });
  });

  describe('averaging: "active-months" (default)', () => {
    it("divides the total only by the months with movement", () => {
      const result = aggregateMonthlyWindow({
        monthKeys: ["2025-01", "2025-02", "2025-03", "2025-04"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expenses: 400 }),
          "2025-03": makeMonthlyEntry({ expenses: 800 }),
        },
        selectValue: (entry) => entry.expenses,
      });

      // total 1200 over 2 active months → average 600 (not 300).
      expect(result.total).toBe(1200);
      expect(result.average).toBe(600);
      expect(result.activeMonths).toBe(2);
    });

    it("computes the median over the active values only, ignoring zero months", () => {
      const result = aggregateMonthlyWindow({
        monthKeys: ["2025-01", "2025-02", "2025-03"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ income: 0 }),
          "2025-02": makeMonthlyEntry({ income: 1000 }),
          "2025-03": makeMonthlyEntry({ income: 2000 }),
        },
        selectValue: (entry) => entry.income,
      });

      expect(result.activeMonths).toBe(2);
      expect(result.average).toBe(1500); // 3000 / 2 active months
      expect(result.median).toBe(1500); // median of [1000, 2000]
    });

    it("matches fixed-window when every month is active", () => {
      const result = aggregateMonthlyWindow({
        monthKeys: ["2025-01", "2025-02"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 250 },
          }),
          "2025-02": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 150 },
          }),
        },
        selectValue: (entry) => entry.expensesByCategory["cat-food"] ?? 0,
      });

      expect(result.total).toBe(400);
      expect(result.average).toBe(200);
      expect(result.median).toBe(200);
      expect(result.activeMonths).toBe(2);
    });

    it("returns zeroed stats when there are no active months", () => {
      const result = aggregateMonthlyWindow({
        monthKeys: ["2025-01", "2025-02"],
        monthlyBreakdown: {},
        selectValue: (entry) => entry.expenses,
      });

      expect(result).toEqual({
        average: 0,
        median: 0,
        total: 0,
        activeMonths: 0,
      });
    });
  });
});
