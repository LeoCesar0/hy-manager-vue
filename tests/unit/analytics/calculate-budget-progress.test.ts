import { describe, it, expect } from "vitest";
import { makeBudget, makeCategory, makeMonthlyEntry } from "../../helpers";
import { calculateBudgetProgress } from "~/services/analytics/calculate-budget-progress";

describe("calculateBudgetProgress", () => {
  it("returns null for overall items when no limits are set", () => {
    const result = calculateBudgetProgress({
      budget: makeBudget({ monthlyExpenseLimit: null, monthlyIncomeGoal: null }),
      monthData: makeMonthlyEntry({ income: 5000, expenses: 3000 }),
      categories: [],
    });

    expect(result.overallExpense).toBeNull();
    expect(result.overallIncome).toBeNull();
    expect(result.categoryItems).toEqual([]);
  });

  it("calculates overall expense progress correctly", () => {
    const result = calculateBudgetProgress({
      budget: makeBudget({ monthlyExpenseLimit: 5000 }),
      monthData: makeMonthlyEntry({ expenses: 3500 }),
      categories: [],
    });

    expect(result.overallExpense).not.toBeNull();
    expect(result.overallExpense!.current).toBe(3500);
    expect(result.overallExpense!.target).toBe(5000);
    expect(result.overallExpense!.percentage).toBe(70);
    expect(result.overallExpense!.isOverBudget).toBe(false);
    expect(result.overallExpense!.variant).toBe("expense");
  });

  it("detects over-budget expenses", () => {
    const result = calculateBudgetProgress({
      budget: makeBudget({ monthlyExpenseLimit: 3000 }),
      monthData: makeMonthlyEntry({ expenses: 4500 }),
      categories: [],
    });

    expect(result.overallExpense!.isOverBudget).toBe(true);
    expect(result.overallExpense!.percentage).toBe(150);
  });

  it("calculates overall income progress correctly", () => {
    const result = calculateBudgetProgress({
      budget: makeBudget({ monthlyIncomeGoal: 10000 }),
      monthData: makeMonthlyEntry({ income: 7500 }),
      categories: [],
    });

    expect(result.overallIncome).not.toBeNull();
    expect(result.overallIncome!.current).toBe(7500);
    expect(result.overallIncome!.target).toBe(10000);
    expect(result.overallIncome!.percentage).toBe(75);
    expect(result.overallIncome!.isOverBudget).toBe(false);
    expect(result.overallIncome!.variant).toBe("deposit");
  });

  it("calculates per-category expense budget progress", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-transport", name: "Transporte" }),
    ];

    const result = calculateBudgetProgress({
      budget: makeBudget({
        categoryBudgets: [
          { categoryId: "cat-food", type: "expense", amount: 1000 },
          { categoryId: "cat-transport", type: "expense", amount: 500 },
        ],
      }),
      monthData: makeMonthlyEntry({
        expensesByCategory: { "cat-food": 800, "cat-transport": 600 },
      }),
      categories,
    });

    expect(result.categoryItems).toHaveLength(2);

    const food = result.categoryItems[0]!;
    expect(food.label).toBe("Alimentação");
    expect(food.current).toBe(800);
    expect(food.target).toBe(1000);
    expect(food.percentage).toBe(80);
    expect(food.isOverBudget).toBe(false);

    const transport = result.categoryItems[1]!;
    expect(transport.label).toBe("Transporte");
    expect(transport.current).toBe(600);
    expect(transport.target).toBe(500);
    expect(transport.isOverBudget).toBe(true);
  });

  it("calculates per-category deposit budget progress", () => {
    const categories = [makeCategory({ id: "cat-salary", name: "Salário" })];

    const result = calculateBudgetProgress({
      budget: makeBudget({
        categoryBudgets: [
          { categoryId: "cat-salary", type: "deposit", amount: 8000 },
        ],
      }),
      monthData: makeMonthlyEntry({
        depositsByCategory: { "cat-salary": 8000 },
      }),
      categories,
    });

    expect(result.categoryItems).toHaveLength(1);
    const salary = result.categoryItems[0]!;
    expect(salary.percentage).toBe(100);
    expect(salary.isOverBudget).toBe(false);
    expect(salary.variant).toBe("deposit");
  });

  it("handles category not found in month data (0 current)", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cat 1" })];

    const result = calculateBudgetProgress({
      budget: makeBudget({
        categoryBudgets: [
          { categoryId: "cat-1", type: "expense", amount: 500 },
        ],
      }),
      monthData: makeMonthlyEntry({}),
      categories,
    });

    const item = result.categoryItems[0]!;
    expect(item.current).toBe(0);
    expect(item.percentage).toBe(0);
    expect(item.isOverBudget).toBe(false);
  });

  it("uses 'Categoria desconhecida' when category is not in lookup", () => {
    const result = calculateBudgetProgress({
      budget: makeBudget({
        categoryBudgets: [
          { categoryId: "unknown-id", type: "expense", amount: 500 },
        ],
      }),
      monthData: makeMonthlyEntry({}),
      categories: [],
    });

    expect(result.categoryItems[0]!.label).toBe("Categoria desconhecida");
  });

  it("skips overall expense when limit is 0", () => {
    const result = calculateBudgetProgress({
      budget: makeBudget({ monthlyExpenseLimit: 0 }),
      monthData: makeMonthlyEntry({ expenses: 1000 }),
      categories: [],
    });

    expect(result.overallExpense).toBeNull();
  });
});
