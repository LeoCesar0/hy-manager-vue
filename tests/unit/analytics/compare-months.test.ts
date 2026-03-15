import { describe, it, expect } from "vitest";
import { makeCategory, makeCounterparty, makeMonthlyEntry } from "../../helpers";
import { compareMonths } from "~/services/analytics/compare-months";

describe("compareMonths", () => {
  it("computes category deltas between two months", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-transport", name: "Transporte" }),
    ];

    const result = compareMonths({
      monthKeys: ["2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({
          income: 0,
          expenses: 400,
          expensesByCategory: { "cat-food": 300, "cat-transport": 100 },
        }),
        "2024-02": makeMonthlyEntry({
          income: 0,
          expenses: 500,
          expensesByCategory: { "cat-food": 200, "cat-transport": 300 },
        }),
      },
      categories,
      counterparties: [],
    });

    const food = result.categoryDeltas.find((d) => d.id === "cat-food")!;
    expect(food.amounts["2024-01"]).toBe(300);
    expect(food.amounts["2024-02"]).toBe(200);
    expect(food.change).toBe(-100);
    expect(food.changePercent).toBeCloseTo(-33.33, 1);

    const transport = result.categoryDeltas.find((d) => d.id === "cat-transport")!;
    expect(transport.change).toBe(200);
    expect(transport.changePercent).toBe(200);
  });

  it("computes counterparty deltas", () => {
    const counterparties = [
      makeCounterparty({ id: "cp-1", name: "Supermarket" }),
    ];

    const result = compareMonths({
      monthKeys: ["2024-03", "2024-04"],
      monthlyBreakdown: {
        "2024-03": makeMonthlyEntry({
          expenses: 200,
          expensesByCounterparty: { "cp-1": 200 },
        }),
        "2024-04": makeMonthlyEntry({
          expenses: 350,
          expensesByCounterparty: { "cp-1": 350 },
        }),
      },
      categories: [],
      counterparties,
    });

    expect(result.counterpartyDeltas).toHaveLength(1);
    const cp = result.counterpartyDeltas[0]!;
    expect(cp.name).toBe("Supermarket");
    expect(cp.change).toBe(150);
    expect(cp.changePercent).toBe(75);
  });

  it("computes totals for each month", () => {
    const result = compareMonths({
      monthKeys: ["2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({ income: 5000, expenses: 3000 }),
        "2024-02": makeMonthlyEntry({ income: 6000, expenses: 4000 }),
      },
      categories: [],
      counterparties: [],
    });

    expect(result.totals.income["2024-01"]).toBe(5000);
    expect(result.totals.income["2024-02"]).toBe(6000);
    expect(result.totals.expenses["2024-01"]).toBe(3000);
    expect(result.totals.balance["2024-01"]).toBe(2000);
    expect(result.totals.balance["2024-02"]).toBe(2000);
  });

  it("handles missing month data gracefully", () => {
    const result = compareMonths({
      monthKeys: ["2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({ income: 1000, expenses: 500 }),
        // 2024-02 missing
      },
      categories: [],
      counterparties: [],
    });

    expect(result.totals.income["2024-02"]).toBe(0);
    expect(result.totals.expenses["2024-02"]).toBe(0);
    expect(result.totals.balance["2024-02"]).toBe(0);
  });

  it("sorts months chronologically regardless of input order", () => {
    const result = compareMonths({
      monthKeys: ["2024-03", "2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({ income: 100, expenses: 50 }),
        "2024-02": makeMonthlyEntry({ income: 200, expenses: 100 }),
        "2024-03": makeMonthlyEntry({ income: 300, expenses: 150 }),
      },
      categories: [],
      counterparties: [],
    });

    const incomeKeys = Object.keys(result.totals.income);
    expect(incomeKeys).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  it("uses 'Desconhecido' for categories not found in lookup", () => {
    const result = compareMonths({
      monthKeys: ["2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({
          expensesByCategory: { "unknown-cat": 100 },
        }),
        "2024-02": makeMonthlyEntry({
          expensesByCategory: { "unknown-cat": 200 },
        }),
      },
      categories: [],
      counterparties: [],
    });

    expect(result.categoryDeltas[0]!.name).toBe("Desconhecido");
  });

  it("returns null change/changePercent when only one month provided", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Food" })];

    const result = compareMonths({
      monthKeys: ["2024-01"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({
          expensesByCategory: { "cat-1": 100 },
        }),
      },
      categories,
      counterparties: [],
    });

    expect(result.categoryDeltas[0]!.change).toBeNull();
    expect(result.categoryDeltas[0]!.changePercent).toBeNull();
  });

  it("returns null changePercent when first month value is 0", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Food" })];

    const result = compareMonths({
      monthKeys: ["2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({}),
        "2024-02": makeMonthlyEntry({
          expensesByCategory: { "cat-1": 200 },
        }),
      },
      categories,
      counterparties: [],
    });

    const delta = result.categoryDeltas[0]!;
    expect(delta.change).toBe(200);
    expect(delta.changePercent).toBeNull();
  });

  it("sorts category deltas by last month amount descending", () => {
    const categories = [
      makeCategory({ id: "cat-a", name: "A" }),
      makeCategory({ id: "cat-b", name: "B" }),
      makeCategory({ id: "cat-c", name: "C" }),
    ];

    const result = compareMonths({
      monthKeys: ["2024-01", "2024-02"],
      monthlyBreakdown: {
        "2024-01": makeMonthlyEntry({
          expensesByCategory: { "cat-a": 100, "cat-b": 200, "cat-c": 300 },
        }),
        "2024-02": makeMonthlyEntry({
          expensesByCategory: { "cat-a": 500, "cat-b": 50, "cat-c": 200 },
        }),
      },
      categories,
      counterparties: [],
    });

    expect(result.categoryDeltas.map((d) => d.id)).toEqual(["cat-a", "cat-c", "cat-b"]);
  });
});
