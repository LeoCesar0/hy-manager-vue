import { describe, it, expect, beforeEach } from "vitest";
import { makeTransaction, resetFactoryCounter } from "../../helpers";
import { removeCounterpartyFromTransactions } from "~/services/api/sync/remove-counterparty-from-transactions";

describe("removeCounterpartyFromTransactions", () => {
  beforeEach(() => {
    resetFactoryCounter();
  });

  it("sets counterpartyId to null on matching transactions", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1" });
    const t2 = makeTransaction({ counterpartyId: "cp-1" });

    const result = removeCounterpartyFromTransactions({
      counterpartyId: "cp-1",
      transactions: [t1, t2],
    });

    expect(result).toHaveLength(2);
    expect(result[0].counterpartyId).toBeNull();
    expect(result[1].counterpartyId).toBeNull();
  });

  it("returns only changed transactions", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1" });
    const t2 = makeTransaction({ counterpartyId: "cp-2" });

    const result = removeCounterpartyFromTransactions({
      counterpartyId: "cp-1",
      transactions: [t1, t2],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(t1.id);
  });

  it("returns empty array when no transactions match", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-2" });

    const result = removeCounterpartyFromTransactions({
      counterpartyId: "cp-1",
      transactions: [t1],
    });

    expect(result).toEqual([]);
  });

  it("handles empty transactions array", () => {
    const result = removeCounterpartyFromTransactions({
      counterpartyId: "cp-1",
      transactions: [],
    });

    expect(result).toEqual([]);
  });

  it("skips transactions with null counterpartyId", () => {
    const t1 = makeTransaction({ counterpartyId: null });

    const result = removeCounterpartyFromTransactions({
      counterpartyId: "cp-1",
      transactions: [t1],
    });

    expect(result).toEqual([]);
  });
});
