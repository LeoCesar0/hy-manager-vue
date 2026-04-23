import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
  makeCounterparty,
  makeReport,
  resetFactoryCounter,
} from "../../helpers";

const mockBatch = {
  commit: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
};

const pageBatch = {
  commit: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
};

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    writeBatch: vi.fn(() => mockBatch),
    deleteField: vi.fn(() => "__deleteField__"),
  };
});

vi.stubGlobal("useFirebaseStore", () => ({ firebaseDB: {} }));

vi.mock("~/services/firebase/cascadePaginatedBatch", () => ({
  cascadePaginatedBatch: firebaseMocks.cascadePaginatedBatch,
}));
vi.mock("~/services/firebase/firebaseGet", () => ({ firebaseGet: firebaseMocks.firebaseGet }));
vi.mock("~/services/firebase/createDocRef", () => ({
  createDocRef: vi.fn(({ id }: { id: string }) => ({ __mockRef: true, id })),
}));

import { cascadeDeleteCategory } from "~/services/api/sync/cascade-delete-category";

describe("cascadeDeleteCategory", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    [mockBatch, pageBatch].forEach((b) => {
      b.commit.mockReset().mockResolvedValue(undefined);
      b.delete.mockReset();
      b.update.mockReset();
      b.set.mockReset();
    });
  });

  it("removes categoryId from transactions, counterparties, and reports", async () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1", "cat-2"], bankAccountId: "bank-1" });
    const t2 = makeTransaction({ categoryIds: ["cat-1"], bankAccountId: "bank-2" });
    const cp1 = makeCounterparty({ categoryIds: ["cat-1", "cat-3"] });
    const report1 = makeReport({ bankAccountId: "bank-1", expensesByCategory: { "cat-1": 100 } });
    const report2 = makeReport({ bankAccountId: "bank-2", expensesByCategory: { "cat-1": 50 } });

    // First call: transactions. Second: counterparties.
    firebaseMocks.cascadePaginatedBatch
      .mockImplementationOnce(
        async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
          await onPage({ items: [t1, t2], batch: pageBatch });
        }
      )
      .mockImplementationOnce(
        async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
          await onPage({ items: [cp1], batch: pageBatch });
        }
      );
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report1).mockResolvedValueOnce(report2);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    // pageBatch received 2 tx updates + 1 counterparty update
    expect(pageBatch.update).toHaveBeenCalledTimes(3);

    // Reports: mockBatch.update called for each bank account, one commit
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no transactions or counterparties match (no report batch committed)", async () => {
    firebaseMocks.cascadePaginatedBatch
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(firebaseMocks.firebaseGet).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("invokes the helper with the expected tx filter", async () => {
    firebaseMocks.cascadePaginatedBatch
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(firebaseMocks.cascadePaginatedBatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "transactions",
        filters: [
          { field: "userId", operator: "==", value: "user-1" },
          { field: "categoryIds", operator: "array-contains", value: "cat-1" },
        ],
      })
    );
    expect(firebaseMocks.cascadePaginatedBatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "creditors",
        filters: [
          { field: "userId", operator: "==", value: "user-1" },
          { field: "categoryIds", operator: "array-contains", value: "cat-1" },
        ],
      })
    );
  });

  it("handles report fetch failure gracefully", async () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1"], bankAccountId: "bank-1" });

    firebaseMocks.cascadePaginatedBatch
      .mockImplementationOnce(
        async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
          await onPage({ items: [t1], batch: pageBatch });
        }
      )
      .mockResolvedValueOnce(undefined);
    firebaseMocks.firebaseGet.mockRejectedValueOnce(new Error("not found"));

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(pageBatch.update).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
