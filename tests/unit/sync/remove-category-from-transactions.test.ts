import { describe, it, expect, beforeEach } from "vitest";
import { makeTransaction, resetFactoryCounter } from "../../helpers";
import { removeCategoryFromTransactions } from "~/services/api/sync/remove-category-from-transactions";

describe("removeCategoryFromTransactions", () => {
  beforeEach(() => {
    resetFactoryCounter();
  });

  it("removes categoryId from matching transactions", () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1", "cat-2"] });
    const t2 = makeTransaction({ categoryIds: ["cat-1"] });

    const result = removeCategoryFromTransactions({
      categoryId: "cat-1",
      transactions: [t1, t2],
    });

    expect(result).toHaveLength(2);
    expect(result[0].categoryIds).toEqual(["cat-2"]);
    expect(result[1].categoryIds).toEqual([]);
  });

  it("returns only changed transactions", () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1", "cat-2"] });
    const t2 = makeTransaction({ categoryIds: ["cat-3"] });

    const result = removeCategoryFromTransactions({
      categoryId: "cat-1",
      transactions: [t1, t2],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(t1.id);
  });

  it("returns empty array when no transactions match", () => {
    const t1 = makeTransaction({ categoryIds: ["cat-2"] });

    const result = removeCategoryFromTransactions({
      categoryId: "cat-1",
      transactions: [t1],
    });

    expect(result).toEqual([]);
  });

  it("handles empty transactions array", () => {
    const result = removeCategoryFromTransactions({
      categoryId: "cat-1",
      transactions: [],
    });

    expect(result).toEqual([]);
  });

  it("handles duplicate categoryIds", () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1", "cat-1", "cat-2"] });

    const result = removeCategoryFromTransactions({
      categoryId: "cat-1",
      transactions: [t1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].categoryIds).toEqual(["cat-2"]);
  });
});
