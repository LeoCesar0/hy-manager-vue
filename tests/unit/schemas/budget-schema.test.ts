import { describe, it, expect } from "vitest";
import { zBudgetBase } from "~/@schemas/models/budget";

describe("budget schema", () => {
  it("parses a valid budget base", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: 5000,
      monthlyIncomeGoal: 8000,
      categoryBudgets: [
        { categoryId: "cat-1", type: "expense", amount: 1000 },
        { categoryId: "cat-2", type: "deposit", amount: 2000 },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthlyExpenseLimit).toBe(5000);
      expect(result.data.monthlyIncomeGoal).toBe(8000);
      expect(result.data.categoryBudgets).toHaveLength(2);
    }
  });

  it("allows null for monthlyExpenseLimit and monthlyIncomeGoal", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthlyExpenseLimit).toBeNull();
      expect(result.data.monthlyIncomeGoal).toBeNull();
    }
  });

  it("rejects empty userId", () => {
    const result = zBudgetBase.safeParse({
      userId: "",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty bankAccountId", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [],
    });

    expect(result.success).toBe(false);
  });

  it("coerces string amounts in categoryBudgets", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [
        { categoryId: "cat-1", type: "expense", amount: "500" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryBudgets[0]!.amount).toBe(500);
    }
  });

  it("rejects negative category budget amounts", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [
        { categoryId: "cat-1", type: "expense", amount: -100 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects zero category budget amounts", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [
        { categoryId: "cat-1", type: "expense", amount: 0 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid category budget type", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [
        { categoryId: "cat-1", type: "transfer", amount: 100 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty categoryId in categoryBudgets", () => {
    const result = zBudgetBase.safeParse({
      userId: "user-1",
      bankAccountId: "bank-1",
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgets: [
        { categoryId: "", type: "expense", amount: 100 },
      ],
    });

    expect(result.success).toBe(false);
  });
});
