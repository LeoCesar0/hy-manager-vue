import { describe, it, expect, beforeEach } from "vitest";
import { Timestamp } from "firebase/firestore";
import { applyBankAccountUpsert } from "~/helpers/bank-account/applyBankAccountUpsert";
import { applyBankAccountRemoval } from "~/helpers/bank-account/applyBankAccountRemoval";
import {
  makeBankAccount,
  resetFactoryCounter,
} from "../../helpers/factories";

beforeEach(() => {
  resetFactoryCounter();
});

const ts = (millis: number) => Timestamp.fromMillis(millis);

describe("applyBankAccountUpsert", () => {
  it("appends a newly created account to the list", () => {
    const existing = makeBankAccount({ id: "a", name: "Account A" });
    const created = makeBankAccount({ id: "b", name: "Account B" });

    const result = applyBankAccountUpsert({
      accounts: [existing],
      current: existing,
      account: created,
    });

    expect(result.accounts.map((a) => a.id)).toEqual(["a", "b"]);
    // current stays untouched when one is already selected
    expect(result.current?.id).toBe("a");
  });

  it("auto-selects the new account when none is currently selected", () => {
    const created = makeBankAccount({ id: "b", name: "Account B" });

    const result = applyBankAccountUpsert({
      accounts: [],
      current: null,
      account: created,
    });

    expect(result.accounts.map((a) => a.id)).toEqual(["b"]);
    expect(result.current?.id).toBe("b");
  });

  it("replaces an existing account in place (no duplicate, order preserved)", () => {
    const a = makeBankAccount({ id: "a", name: "Account A" });
    const b = makeBankAccount({ id: "b", name: "Account B" });
    const updatedB = makeBankAccount({ id: "b", name: "Account B Renamed" });

    const result = applyBankAccountUpsert({
      accounts: [a, b],
      current: a,
      account: updatedB,
    });

    expect(result.accounts.map((a) => a.id)).toEqual(["a", "b"]);
    expect(result.accounts.find((x) => x.id === "b")?.name).toBe(
      "Account B Renamed",
    );
  });

  it("patches currentBankAccount when the updated account is the selected one", () => {
    const a = makeBankAccount({ id: "a", name: "Old Name" });
    const updatedA = makeBankAccount({ id: "a", name: "New Name" });

    const result = applyBankAccountUpsert({
      accounts: [a],
      current: a,
      account: updatedA,
    });

    expect(result.current?.id).toBe("a");
    expect(result.current?.name).toBe("New Name");
  });

  it("does not change the current selection when updating a non-selected account", () => {
    const a = makeBankAccount({ id: "a", name: "Account A" });
    const b = makeBankAccount({ id: "b", name: "Account B" });
    const updatedB = makeBankAccount({ id: "b", name: "Account B v2" });

    const result = applyBankAccountUpsert({
      accounts: [a, b],
      current: a,
      account: updatedB,
    });

    expect(result.current?.id).toBe("a");
    expect(result.current?.name).toBe("Account A");
  });
});

describe("applyBankAccountRemoval", () => {
  it("removes the account from the list", () => {
    const a = makeBankAccount({ id: "a" });
    const b = makeBankAccount({ id: "b" });

    const result = applyBankAccountRemoval({
      accounts: [a, b],
      current: a,
      removedId: "b",
    });

    expect(result.accounts.map((x) => x.id)).toEqual(["a"]);
  });

  it("keeps the current selection when a non-selected account is removed", () => {
    const a = makeBankAccount({ id: "a" });
    const b = makeBankAccount({ id: "b" });

    const result = applyBankAccountRemoval({
      accounts: [a, b],
      current: a,
      removedId: "b",
    });

    expect(result.current?.id).toBe("a");
  });

  it("falls back to the most-recently-updated remaining account when the current one is removed", () => {
    const a = makeBankAccount({ id: "a", updatedAt: ts(1000) });
    const b = makeBankAccount({ id: "b", updatedAt: ts(3000) }); // most recent
    const c = makeBankAccount({ id: "c", updatedAt: ts(2000) });

    const result = applyBankAccountRemoval({
      accounts: [a, b, c],
      current: a,
      removedId: "a",
    });

    expect(result.accounts.map((x) => x.id)).toEqual(["b", "c"]);
    expect(result.current?.id).toBe("b");
  });

  it("sets current to null when the last account is removed", () => {
    const a = makeBankAccount({ id: "a" });

    const result = applyBankAccountRemoval({
      accounts: [a],
      current: a,
      removedId: "a",
    });

    expect(result.accounts).toEqual([]);
    expect(result.current).toBeNull();
  });

  it("is a no-op for current when removing an id that is not selected and not present", () => {
    const a = makeBankAccount({ id: "a" });

    const result = applyBankAccountRemoval({
      accounts: [a],
      current: a,
      removedId: "missing",
    });

    expect(result.accounts.map((x) => x.id)).toEqual(["a"]);
    expect(result.current?.id).toBe("a");
  });
});
