import { describe, it, expect, beforeEach } from "vitest";
import { buildObjetivoRows } from "~/helpers/budget/buildObjetivoRows";
import {
  makeBankAccount,
  makeBudget,
  resetFactoryCounter,
} from "../../helpers/factories";

beforeEach(() => {
  resetFactoryCounter();
});

describe("buildObjetivoRows", () => {
  it("returns one row per bank account, in account order", () => {
    const accounts = [
      makeBankAccount({ id: "a", name: "Conta A" }),
      makeBankAccount({ id: "b", name: "Conta B" }),
    ];

    const rows = buildObjetivoRows({ bankAccounts: accounts, budgets: [] });

    expect(rows.map((r) => r.bankAccountId)).toEqual(["a", "b"]);
    expect(rows.map((r) => r.bankAccountName)).toEqual(["Conta A", "Conta B"]);
  });

  it("marks an account with no budget doc as not configured", () => {
    const accounts = [makeBankAccount({ id: "a", name: "Conta A" })];

    const rows = buildObjetivoRows({ bankAccounts: accounts, budgets: [] });

    expect(rows[0]).toMatchObject({
      budget: null,
      monthlyExpenseLimit: null,
      monthlyIncomeGoal: null,
      categoryBudgetsCount: 0,
      isConfigured: false,
    });
  });

  it("treats a bare budget doc (all empty) as not configured", () => {
    const accounts = [makeBankAccount({ id: "a" })];
    const budgets = [
      makeBudget({
        id: "a",
        bankAccountId: "a",
        monthlyExpenseLimit: null,
        monthlyIncomeGoal: null,
        categoryBudgets: [],
      }),
    ];

    const rows = buildObjetivoRows({ bankAccounts: accounts, budgets });

    expect(rows[0]!.budget).not.toBeNull();
    expect(rows[0]!.isConfigured).toBe(false);
  });

  it("surfaces expense limit, income goal and category count from a configured doc", () => {
    const accounts = [makeBankAccount({ id: "a" })];
    const budgets = [
      makeBudget({
        id: "a",
        bankAccountId: "a",
        monthlyExpenseLimit: 5000,
        monthlyIncomeGoal: 8000,
        categoryBudgets: [
          { categoryId: "c1", type: "expense", amount: 100 },
          { categoryId: "c2", type: "deposit", amount: 200 },
        ],
      }),
    ];

    const rows = buildObjetivoRows({ bankAccounts: accounts, budgets });

    expect(rows[0]).toMatchObject({
      monthlyExpenseLimit: 5000,
      monthlyIncomeGoal: 8000,
      categoryBudgetsCount: 2,
      isConfigured: true,
    });
  });

  it("counts a doc with only category budgets as configured", () => {
    const accounts = [makeBankAccount({ id: "a" })];
    const budgets = [
      makeBudget({
        id: "a",
        bankAccountId: "a",
        categoryBudgets: [{ categoryId: "c1", type: "expense", amount: 50 }],
      }),
    ];

    const rows = buildObjetivoRows({ bankAccounts: accounts, budgets });

    expect(rows[0]!.isConfigured).toBe(true);
    expect(rows[0]!.categoryBudgetsCount).toBe(1);
  });

  it("matches budgets to accounts by bankAccountId, ignoring orphan budgets", () => {
    const accounts = [
      makeBankAccount({ id: "a" }),
      makeBankAccount({ id: "b" }),
    ];
    const budgets = [
      makeBudget({ id: "b", bankAccountId: "b", monthlyExpenseLimit: 300 }),
      // Orphan: no matching account — must not produce a row.
      makeBudget({ id: "z", bankAccountId: "z", monthlyExpenseLimit: 999 }),
    ];

    const rows = buildObjetivoRows({ bankAccounts: accounts, budgets });

    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.bankAccountId === "a")!.isConfigured).toBe(false);
    expect(rows.find((r) => r.bankAccountId === "b")!.monthlyExpenseLimit).toBe(
      300
    );
  });
});
