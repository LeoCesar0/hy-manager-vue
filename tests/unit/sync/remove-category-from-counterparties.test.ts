import { describe, it, expect, beforeEach } from "vitest";
import { makeCounterparty, resetFactoryCounter } from "../../helpers";
import { removeCategoryFromCounterparties } from "~/services/api/sync/remove-category-from-counterparties";

describe("removeCategoryFromCounterparties", () => {
  beforeEach(() => {
    resetFactoryCounter();
  });

  it("removes categoryId from matching counterparties", () => {
    const cp1 = makeCounterparty({ categoryIds: ["cat-1", "cat-2"] });
    const cp2 = makeCounterparty({ categoryIds: ["cat-1"] });

    const result = removeCategoryFromCounterparties({
      categoryId: "cat-1",
      counterparties: [cp1, cp2],
    });

    expect(result).toHaveLength(2);
    expect(result[0].categoryIds).toEqual(["cat-2"]);
    expect(result[1].categoryIds).toEqual([]);
  });

  it("returns only changed counterparties", () => {
    const cp1 = makeCounterparty({ categoryIds: ["cat-1", "cat-2"] });
    const cp2 = makeCounterparty({ categoryIds: ["cat-3"] });

    const result = removeCategoryFromCounterparties({
      categoryId: "cat-1",
      counterparties: [cp1, cp2],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(cp1.id);
  });

  it("returns empty array when no counterparties match", () => {
    const cp1 = makeCounterparty({ categoryIds: ["cat-2"] });

    const result = removeCategoryFromCounterparties({
      categoryId: "cat-1",
      counterparties: [cp1],
    });

    expect(result).toEqual([]);
  });

  it("handles empty counterparties array", () => {
    const result = removeCategoryFromCounterparties({
      categoryId: "cat-1",
      counterparties: [],
    });

    expect(result).toEqual([]);
  });

  it("handles duplicate categoryIds", () => {
    const cp1 = makeCounterparty({ categoryIds: ["cat-1", "cat-1", "cat-2"] });

    const result = removeCategoryFromCounterparties({
      categoryId: "cat-1",
      counterparties: [cp1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].categoryIds).toEqual(["cat-2"]);
  });
});
