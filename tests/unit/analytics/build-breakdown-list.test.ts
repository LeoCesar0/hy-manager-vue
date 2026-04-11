import { describe, it, expect } from "vitest";
import { makeCategory, makeCounterparty, makeMonthlyEntry } from "../../helpers";
import { buildBreakdownList } from "~/services/analytics/build-breakdown-list";

describe("buildBreakdownList", () => {
  const categories = [
    makeCategory({ id: "cat-food", name: "Alimentação", color: "#ff0000" }),
    makeCategory({ id: "cat-salary", name: "Salário", color: "#00ff00" }),
    makeCategory({ id: "cat-refund", name: "Reembolsos", color: "#ffaa00" }),
  ];

  const counterparties = [
    makeCounterparty({ id: "cp-market", name: "Supermarket" }),
    makeCounterparty({ id: "cp-employer", name: "Employer" }),
  ];

  describe("category mode", () => {
    it("tracks pure expense, pure deposit, and mixed items with correct totals", () => {
      const result = buildBreakdownList({
        monthKeys: ["2025-01", "2025-02"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 250, "cat-refund": 100 },
            depositsByCategory: { "cat-salary": 1500, "cat-refund": 150 },
          }),
          "2025-02": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 250, "cat-refund": 100 },
            depositsByCategory: { "cat-salary": 1500, "cat-refund": 150 },
          }),
        },
        fields: {
          expenseField: "expensesByCategory",
          depositField: "depositsByCategory",
        },
        lookup: categories,
        topN: 10,
      });

      expect(result).toHaveLength(3);

      const salary = result.find((i) => i.id === "cat-salary")!;
      expect(salary).toMatchObject({
        name: "Salário",
        expenseTotal: 0,
        depositTotal: 3000,
        grossTotal: 3000,
        netTotal: 3000,
      });

      const food = result.find((i) => i.id === "cat-food")!;
      expect(food).toMatchObject({
        name: "Alimentação",
        expenseTotal: 500,
        depositTotal: 0,
        grossTotal: 500,
        netTotal: -500,
      });

      // Mixed: 200 expense, 300 deposit → gross 500, net +100
      const refund = result.find((i) => i.id === "cat-refund")!;
      expect(refund).toMatchObject({
        name: "Reembolsos",
        expenseTotal: 200,
        depositTotal: 300,
        grossTotal: 500,
        netTotal: 100,
      });
    });

    it("sorts by grossTotal descending (activity, not net)", () => {
      const result = buildBreakdownList({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 100, "cat-refund": 1000 },
            depositsByCategory: { "cat-salary": 500, "cat-refund": 1000 },
          }),
        },
        fields: {
          expenseField: "expensesByCategory",
          depositField: "depositsByCategory",
        },
        lookup: categories,
        topN: 10,
      });

      // Refund gross = 2000, salary gross = 500, food gross = 100
      expect(result.map((i) => i.id)).toEqual([
        "cat-refund",
        "cat-salary",
        "cat-food",
      ]);
    });

    it("respects topN cap", () => {
      const manyCategories = Array.from({ length: 20 }, (_, i) =>
        makeCategory({ id: `cat-${i}`, name: `Cat ${i}` })
      );
      const expensesByCategory: Record<string, number> = {};
      for (let i = 0; i < 20; i++) {
        expensesByCategory[`cat-${i}`] = 100 + i; // cat-19 highest
      }

      const result = buildBreakdownList({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expensesByCategory }),
        },
        fields: {
          expenseField: "expensesByCategory",
          depositField: "depositsByCategory",
        },
        lookup: manyCategories,
        topN: 5,
      });

      expect(result).toHaveLength(5);
      expect(result[0]?.id).toBe("cat-19"); // highest
      expect(result[4]?.id).toBe("cat-15"); // 5th highest
    });

    it("labels unknown IDs as 'Desconhecido' instead of dropping them", () => {
      const result = buildBreakdownList({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "stale-id": 300 },
          }),
        },
        fields: {
          expenseField: "expensesByCategory",
          depositField: "depositsByCategory",
        },
        lookup: categories,
        topN: 10,
      });

      expect(result).toEqual([
        {
          id: "stale-id",
          name: "Desconhecido",
          color: null,
          expenseTotal: 300,
          depositTotal: 0,
          grossTotal: 300,
          netTotal: -300,
          isPositiveExpense: false,
        },
      ]);
    });

    it("skips items with zero gross activity", () => {
      // Edge case: an id appears in both maps but cancels to zero gross.
      // This shouldn't happen with real data (amounts are always positive),
      // but the filter protects against stale/zeroed entries.
      const result = buildBreakdownList({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 0 },
            depositsByCategory: { "cat-salary": 100 },
          }),
        },
        fields: {
          expenseField: "expensesByCategory",
          depositField: "depositsByCategory",
        },
        lookup: categories,
        topN: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("cat-salary");
    });

    it("skips months that are missing from the breakdown", () => {
      const result = buildBreakdownList({
        monthKeys: ["2025-01", "2025-99", "2025-03"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 100 },
          }),
          "2025-03": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 200 },
          }),
        },
        fields: {
          expenseField: "expensesByCategory",
          depositField: "depositsByCategory",
        },
        lookup: categories,
        topN: 10,
      });

      expect(result[0]?.expenseTotal).toBe(300);
    });
  });

  describe("counterparty mode", () => {
    it("reads from the counterparty maps when given counterparty field names", () => {
      const result = buildBreakdownList({
        monthKeys: ["2025-01"],
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCounterparty: { "cp-market": 400 },
            depositsByCounterparty: { "cp-employer": 2500 },
          }),
        },
        fields: {
          expenseField: "expensesByCounterparty",
          depositField: "depositsByCounterparty",
        },
        lookup: counterparties,
        topN: 10,
      });

      expect(result).toHaveLength(2);
      expect(result.find((i) => i.id === "cp-employer")).toMatchObject({
        name: "Employer",
        depositTotal: 2500,
        netTotal: 2500,
      });
      expect(result.find((i) => i.id === "cp-market")).toMatchObject({
        name: "Supermarket",
        expenseTotal: 400,
        netTotal: -400,
      });
    });
  });
});
