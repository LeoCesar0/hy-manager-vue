import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
  resetFactoryCounter,
} from "../../helpers";

const pageBatch = {
  commit: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
};

vi.stubGlobal("useFirebaseStore", () => ({ firebaseDB: {} }));

vi.mock("~/services/firebase/cascadePaginatedBatch", () => ({
  cascadePaginatedBatch: firebaseMocks.cascadePaginatedBatch,
}));
vi.mock("~/services/firebase/createDocRef", () => ({
  createDocRef: vi.fn(({ id }: { id: string }) => ({ __mockRef: true, id })),
}));

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
    pageBatch.commit.mockReset().mockResolvedValue(undefined);
    pageBatch.update.mockReset();
    pageBatch.delete.mockReset();
    pageBatch.set.mockReset();
  });

  it("applies diff to matching transactions and rebuilds reports", async () => {
    const t1 = makeTransaction({
      counterpartyId: "cp-1",
      categoryIds: ["cat-1"],
      bankAccountId: "bank-1",
    });

    firebaseMocks.cascadePaginatedBatch.mockImplementationOnce(
      async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
        await onPage({ items: [t1], batch: pageBatch });
      }
    );
    mockRebuildReport.mockResolvedValue({ data: {}, error: null });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-2"],
      userId: "user-1",
    });

    expect(pageBatch.update).toHaveBeenCalledTimes(1);
    expect(pageBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: t1.id }),
      { categoryIds: ["cat-2"] }
    );

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

    expect(firebaseMocks.cascadePaginatedBatch).not.toHaveBeenCalled();
    expect(mockRebuildReport).not.toHaveBeenCalled();
  });

  it("does nothing when no transactions are affected", async () => {
    firebaseMocks.cascadePaginatedBatch.mockResolvedValueOnce(undefined);

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-2"],
      userId: "user-1",
    });

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

    firebaseMocks.cascadePaginatedBatch.mockImplementationOnce(
      async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
        await onPage({ items: [t1, t2], batch: pageBatch });
      }
    );
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

    firebaseMocks.cascadePaginatedBatch.mockImplementationOnce(
      async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
        await onPage({ items: [t1], batch: pageBatch });
      }
    );
    mockRebuildReport.mockResolvedValue({ data: {}, error: null });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "cp-1",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-1", "cat-2"],
      userId: "user-1",
    });

    expect(pageBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: t1.id }),
      { categoryIds: ["cat-1", "cat-2"] }
    );
  });
});
