import { describe, it, expect } from "vitest";
import { makeCategory, makeCounterparty, makeMonthlyEntry } from "../../helpers";
import { aggregatePeriodBreakdowns } from "~/services/analytics/aggregate-period-breakdowns";

describe("aggregatePeriodBreakdowns", () => {
  const categories = [
    makeCategory({ id: "cat-food", name: "Alimentação", color: "#ff0000" }),
    makeCategory({ id: "cat-rent", name: "Aluguel", color: "#00ff00" }),
    makeCategory({ id: "cat-salary", name: "Salário", color: "#0000ff" }),
  ];

  const counterparties = [
    makeCounterparty({ id: "cp-market", name: "Supermarket" }),
    makeCounterparty({ id: "cp-employer", name: "Employer" }),
  ];

  it("sums category/counterparty totals across multiple months", () => {
    const result = aggregatePeriodBreakdowns({
      monthKeys: ["2025-01", "2025-02", "2025-03"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          expensesByCategory: { "cat-food": 100, "cat-rent": 500 },
          depositsByCategory: { "cat-salary": 1000 },
          expensesByCounterparty: { "cp-market": 100 },
          depositsByCounterparty: { "cp-employer": 1000 },
        }),
        "2025-02": makeMonthlyEntry({
          expensesByCategory: { "cat-food": 150, "cat-rent": 500 },
          depositsByCategory: { "cat-salary": 1000 },
          expensesByCounterparty: { "cp-market": 150 },
          depositsByCounterparty: { "cp-employer": 1000 },
        }),
        "2025-03": makeMonthlyEntry({
          expensesByCategory: { "cat-food": 200, "cat-rent": 500 },
          depositsByCategory: { "cat-salary": 1000 },
          expensesByCounterparty: { "cp-market": 200 },
          depositsByCounterparty: { "cp-employer": 1000 },
        }),
      },
      categories,
      counterparties,
    });

    // Expenses by category: rent 1500, food 450 — sorted desc
    expect(result.expensesByCategory).toHaveLength(2);
    expect(result.expensesByCategory[0]).toEqual({
      id: "cat-rent",
      name: "Aluguel",
      amount: 1500,
      color: "#00ff00",
    });
    expect(result.expensesByCategory[1]).toEqual({
      id: "cat-food",
      name: "Alimentação",
      amount: 450,
      color: "#ff0000",
    });

    // Deposits by category
    expect(result.depositsByCategory).toHaveLength(1);
    expect(result.depositsByCategory[0]).toMatchObject({
      id: "cat-salary",
      amount: 3000,
    });

    // Counterparties
    expect(result.expensesByCounterparty[0]).toMatchObject({
      id: "cp-market",
      name: "Supermarket",
      amount: 450,
    });
    expect(result.depositsByCounterparty[0]).toMatchObject({
      id: "cp-employer",
      name: "Employer",
      amount: 3000,
    });
  });

  it("skips months that are missing from the breakdown", () => {
    const result = aggregatePeriodBreakdowns({
      monthKeys: ["2025-01", "2025-99", "2025-03"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          expensesByCategory: { "cat-food": 100 },
        }),
        "2025-03": makeMonthlyEntry({
          expensesByCategory: { "cat-food": 200 },
        }),
      },
      categories,
      counterparties,
    });

    expect(result.expensesByCategory[0]?.amount).toBe(300);
  });

  it("returns empty arrays when no months selected", () => {
    const result = aggregatePeriodBreakdowns({
      monthKeys: [],
      monthlyBreakdown: {},
      categories,
      counterparties,
    });

    expect(result.expensesByCategory).toEqual([]);
    expect(result.depositsByCategory).toEqual([]);
    expect(result.expensesByCounterparty).toEqual([]);
    expect(result.depositsByCounterparty).toEqual([]);
  });

  it("filters out zero-amount entries", () => {
    const result = aggregatePeriodBreakdowns({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          expensesByCategory: { "cat-food": 100, "cat-rent": 0 },
        }),
      },
      categories,
      counterparties,
    });

    expect(result.expensesByCategory).toHaveLength(1);
    expect(result.expensesByCategory[0]?.id).toBe("cat-food");
  });

  describe("positive-expense filter (cross-ref map)", () => {
    const filterCategories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-investment", name: "Tesouro", isPositiveExpense: true }),
    ];
    const filterCounterparties = [
      makeCounterparty({ id: "cp-xp", name: "XP Investimentos" }),
      makeCounterparty({ id: "cp-market", name: "Supermarket" }),
    ];

    it("subtracts positive-expense share from counterparty totals when toggle is off", () => {
      const result = aggregatePeriodBreakdowns({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 100, "cat-investment": 500 },
            expensesByCounterparty: { "cp-xp": 500, "cp-market": 100 },
            expensesByCategoryAndCounterparty: {
              "cat-investment": { "cp-xp": 500 },
              "cat-food": { "cp-market": 100 },
            },
          }),
        },
        categories: filterCategories,
        counterparties: filterCounterparties,
        includePositiveExpenseCategories: false,
      });

      expect(result.expensesByCategory).toHaveLength(1);
      expect(result.expensesByCategory[0]?.id).toBe("cat-food");

      expect(result.expensesByCounterparty).toHaveLength(1);
      expect(result.expensesByCounterparty[0]?.id).toBe("cp-market");
    });

    it("preserves counterparty totals untouched when toggle is on", () => {
      const result = aggregatePeriodBreakdowns({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 100, "cat-investment": 500 },
            expensesByCounterparty: { "cp-xp": 500, "cp-market": 100 },
            expensesByCategoryAndCounterparty: {
              "cat-investment": { "cp-xp": 500 },
              "cat-food": { "cp-market": 100 },
            },
          }),
        },
        categories: filterCategories,
        counterparties: filterCounterparties,
        includePositiveExpenseCategories: true,
      });

      expect(result.expensesByCategory).toHaveLength(2);
      expect(result.expensesByCounterparty).toHaveLength(2);
    });

    it("handles partial subtraction (counterparty has both positive and regular expenses)", () => {
      const result = aggregatePeriodBreakdowns({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            // A single counterparty with both spending types (e.g., a broker
            // that also charges fees as a regular expense).
            expensesByCategory: { "cat-food": 200, "cat-investment": 500 },
            expensesByCounterparty: { "cp-xp": 700 },
            expensesByCategoryAndCounterparty: {
              "cat-investment": { "cp-xp": 500 },
              "cat-food": { "cp-xp": 200 },
            },
          }),
        },
        categories: filterCategories,
        counterparties: filterCounterparties,
        includePositiveExpenseCategories: false,
      });

      expect(result.expensesByCounterparty).toHaveLength(1);
      expect(result.expensesByCounterparty[0]).toMatchObject({
        id: "cp-xp",
        amount: 200,
      });
    });

    it("silently no-ops on old reports with empty cross-ref map", () => {
      // Pre-enrichment reports have no expensesByCategoryAndCounterparty.
      // The counterparty total stays as-is; the filter only affects the
      // category side (which reads from the existing 1D map).
      const result = aggregatePeriodBreakdowns({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 100, "cat-investment": 500 },
            expensesByCounterparty: { "cp-xp": 500, "cp-market": 100 },
            // cross-ref intentionally empty
          }),
        },
        categories: filterCategories,
        counterparties: filterCounterparties,
        includePositiveExpenseCategories: false,
      });

      expect(result.expensesByCategory).toHaveLength(1);
      expect(result.expensesByCategory[0]?.id).toBe("cat-food");
      // counterparty totals unchanged because cross-ref is empty
      expect(result.expensesByCounterparty).toHaveLength(2);
    });
  });

  it("labels unknown category IDs as 'Desconhecido' instead of dropping them", () => {
    const result = aggregatePeriodBreakdowns({
      monthKeys: ["2025-01"],
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          expensesByCategory: { "stale-cat-id": 150 },
        }),
      },
      categories,
      counterparties,
    });

    expect(result.expensesByCategory).toEqual([
      {
        id: "stale-cat-id",
        name: "Desconhecido",
        amount: 150,
        color: undefined,
      },
    ]);
  });
});
