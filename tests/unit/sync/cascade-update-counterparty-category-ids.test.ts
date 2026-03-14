import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
  resetFactoryCounter,
} from "../../helpers";

vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
vi.mock("~/services/firebase/firebaseUpdateMany", () => ({ firebaseUpdateMany: firebaseMocks.firebaseUpdateMany }));
vi.mock("~/services/firebase/firebaseGet", () => ({ firebaseGet: firebaseMocks.firebaseGet }));
vi.mock("~/services/firebase/firebaseUpdate", () => ({ firebaseUpdate: firebaseMocks.firebaseUpdate }));

// Mock rebuild-report — it uses handleAppRequest internally
const mockRebuildReport = vi.fn();
vi.mock("~/services/api/reports/rebuild-report", () => ({
  rebuildReport: (...args: unknown[]) => mockRebuildReport(...args),
}));

import { cascadeUpdateCounterpartyCategoryIds } from "~/services/api/sync/cascade-update-counterparty-category-ids";

describe("cascadeUpdateCounterpartyCategoryIds", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    mockRebuildReport.mockReset();
  });

  it("applies diff to matching transactions and rebuilds reports", async () => {
    const t1 = makeTransaction({
      counterpartyId: "cp-1",
      categoryIds: ["cat-1"],
      bankAccountId: "bank-1",
    });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    mockRebuildReport.mockResolvedValue({ data: {}, error: null });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-2"],
      userId: "user-1",
    });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith({
      collection: "transactions",
      items: [
        { id: t1.id, data: { categoryIds: ["cat-2"] } },
      ],
    });

    expect(mockRebuildReport).toHaveBeenCalledWith({
      userId: "user-1",
      bankAccountId: "bank-1",
      options: { toastOptions: undefined },
    });
  });

  it("does nothing when categoryIds have not changed", async () => {
    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-1"],
      userId: "user-1",
    });

    expect(firebaseMocks.firebaseList).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(mockRebuildReport).not.toHaveBeenCalled();
  });

  it("does nothing when no transactions are affected", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-2"],
      userId: "user-1",
    });

    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(mockRebuildReport).not.toHaveBeenCalled();
  });

  it("rebuilds reports for all affected bank accounts", async () => {
    const t1 = makeTransaction({
      counterpartyId: "cp-1",
      categoryIds: ["cat-1"],
      bankAccountId: "bank-1",
    });
    const t2 = makeTransaction({
      counterpartyId: "cp-1",
      categoryIds: ["cat-1"],
      bankAccountId: "bank-2",
    });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1, t2]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    mockRebuildReport.mockResolvedValue({ data: {}, error: null });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-2"],
      userId: "user-1",
    });

    expect(mockRebuildReport).toHaveBeenCalledTimes(2);
  });

  it("handles additions only (no removals)", async () => {
    const t1 = makeTransaction({
      counterpartyId: "cp-1",
      categoryIds: ["cat-1"],
      bankAccountId: "bank-1",
    });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    mockRebuildReport.mockResolvedValue({ data: {}, error: null });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-1", "cat-2"],
      userId: "user-1",
    });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith({
      collection: "transactions",
      items: [
        { id: t1.id, data: { categoryIds: ["cat-1", "cat-2"] } },
      ],
    });
  });
});
