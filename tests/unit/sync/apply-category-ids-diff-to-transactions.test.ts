import { describe, it, expect, beforeEach } from "vitest";
import { makeTransaction, resetFactoryCounter } from "../../helpers";
import { applyCategoryIdsDiffToTransactions } from "~/services/api/sync/apply-category-ids-diff-to-transactions";

describe("applyCategoryIdsDiffToTransactions", () => {
  beforeEach(() => {
    resetFactoryCounter();
  });

  it("adds new categoryIds to matching transactions", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-1"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: ["cat-2"],
      removedCategoryIds: [],
      transactions: [t1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].categoryIds).toEqual(["cat-1", "cat-2"]);
  });

  it("removes old categoryIds from matching transactions", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-1", "cat-2"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: [],
      removedCategoryIds: ["cat-1"],
      transactions: [t1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].categoryIds).toEqual(["cat-2"]);
  });

  it("applies both adds and removes simultaneously", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-1", "cat-2"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: ["cat-3"],
      removedCategoryIds: ["cat-1"],
      transactions: [t1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].categoryIds).toEqual(["cat-2", "cat-3"]);
  });

  it("only affects transactions with matching counterpartyId", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-1"] });
    const t2 = makeTransaction({ counterpartyId: "cp-2", categoryIds: ["cat-1"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: ["cat-2"],
      removedCategoryIds: [],
      transactions: [t1, t2],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(t1.id);
  });

  it("returns empty array when no transactions match", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-2", categoryIds: ["cat-1"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: ["cat-2"],
      removedCategoryIds: [],
      transactions: [t1],
    });

    expect(result).toEqual([]);
  });

  it("handles empty transactions array", () => {
    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: ["cat-2"],
      removedCategoryIds: ["cat-1"],
      transactions: [],
    });

    expect(result).toEqual([]);
  });

  it("does not add duplicate categoryIds", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-1", "cat-2"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: ["cat-2", "cat-3"],
      removedCategoryIds: [],
      transactions: [t1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].categoryIds).toEqual(["cat-1", "cat-2", "cat-3"]);
  });

  it("returns only transactions that actually changed", () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-1"] });
    const t2 = makeTransaction({ counterpartyId: "cp-1", categoryIds: ["cat-2"] });

    const result = applyCategoryIdsDiffToTransactions({
      counterpartyId: "cp-1",
      addedCategoryIds: [],
      removedCategoryIds: ["cat-1"],
      transactions: [t1, t2],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(t1.id);
  });
});
