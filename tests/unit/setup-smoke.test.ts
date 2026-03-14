import { describe, it, expect } from "vitest";
import {
  makeUser,
  makeBankAccount,
  makeCategory,
  makeTransaction,
  makeCounterparty,
  makeSuccessResponse,
  makeErrorResponse,
  resetFactoryCounter,
} from "../helpers";

describe("test setup smoke test", () => {
  it("should have test environment", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("factories produce valid entities", () => {
    resetFactoryCounter();

    const user = makeUser();
    expect(user.id).toBe("test-id-1");
    expect(user.name).toBe("Test User");
    expect(user.email).toBe("test@example.com");

    const bank = makeBankAccount();
    expect(bank.name).toBe("Test Bank Account");

    const category = makeCategory();
    expect(category.name).toBe("Test Category");

    const transaction = makeTransaction({ amount: 42.99 });
    expect(transaction.amount).toBe(42.99);
    expect(transaction.type).toBe("expense");

    const counterparty = makeCounterparty();
    expect(counterparty.name).toBe("Test Counterparty");
  });

  it("factories accept overrides", () => {
    const user = makeUser({ name: "Custom", email: "custom@test.com" });
    expect(user.name).toBe("Custom");
    expect(user.email).toBe("custom@test.com");
  });

  it("makeSuccessResponse wraps data", () => {
    const res = makeSuccessResponse({ id: "1" });
    expect(res.data).toEqual({ id: "1" });
    expect(res.error).toBeNull();
  });

  it("makeErrorResponse wraps error", () => {
    const res = makeErrorResponse("Something failed", { code: "NOT_FOUND" });
    expect(res.data).toBeNull();
    expect(res.error._isAppError).toBe(true);
    expect(res.error.message).toBe("Something failed");
    expect(res.error.code).toBe("NOT_FOUND");
  });
});
