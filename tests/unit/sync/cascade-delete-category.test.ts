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

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    writeBatch: vi.fn(() => mockBatch),
    deleteField: vi.fn(() => "__deleteField__"),
  };
});

vi.stubGlobal("useFirebaseStore", () => ({ firebaseDB: {} }));

vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
vi.mock("~/services/firebase/firebaseUpdateMany", () => ({ firebaseUpdateMany: firebaseMocks.firebaseUpdateMany }));
vi.mock("~/services/firebase/firebaseGet", () => ({ firebaseGet: firebaseMocks.firebaseGet }));
vi.mock("~/services/firebase/createDocRef", () => ({ createDocRef: vi.fn(({ id }: { id: string }) => ({ __mockRef: true, id })) }));

import { cascadeDeleteCategory } from "~/services/api/sync/cascade-delete-category";

describe("cascadeDeleteCategory", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    mockBatch.commit.mockReset().mockResolvedValue(undefined);
    mockBatch.delete.mockReset();
    mockBatch.update.mockReset();
    mockBatch.set.mockReset();
  });

  it("removes categoryId from transactions, counterparties, and reports in a single batch", async () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1", "cat-2"], bankAccountId: "bank-1" });
    const t2 = makeTransaction({ categoryIds: ["cat-1"], bankAccountId: "bank-2" });
    const cp1 = makeCounterparty({ categoryIds: ["cat-1", "cat-3"] });
    const report1 = makeReport({ bankAccountId: "bank-1", expensesByCategory: { "cat-1": 100 } });
    const report2 = makeReport({ bankAccountId: "bank-2", expensesByCategory: { "cat-1": 50 } });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1, t2]);
    firebaseMocks.firebaseList.mockResolvedValueOnce([cp1]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report1);
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report2);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    // Transactions updated with batch
    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        items: [
          { id: t1.id, data: { categoryIds: ["cat-2"] } },
          { id: t2.id, data: { categoryIds: [] } },
        ],
        batch: mockBatch,
      })
    );

    // Counterparties updated with batch
    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "creditors",
        items: [
          { id: cp1.id, data: { categoryIds: ["cat-3"] } },
        ],
        batch: mockBatch,
      })
    );

    // Reports: batch.update called for each bank account
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no transactions or counterparties match", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseGet).not.toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("fetches transactions with array-contains filter", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(firebaseMocks.firebaseList).toHaveBeenCalledWith({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: "user-1" },
        { field: "categoryIds", operator: "array-contains", value: "cat-1" },
      ],
    });
  });

  it("handles report fetch failure gracefully", async () => {
    const t1 = makeTransaction({ categoryIds: ["cat-1"], bankAccountId: "bank-1" });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1]);
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    firebaseMocks.firebaseGet.mockRejectedValueOnce(new Error("not found"));

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).not.toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});
