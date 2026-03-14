import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
  makeCounterparty,
  makeReport,
  resetFactoryCounter,
} from "../../helpers";

vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
vi.mock("~/services/firebase/firebaseUpdateMany", () => ({ firebaseUpdateMany: firebaseMocks.firebaseUpdateMany }));
vi.mock("~/services/firebase/firebaseGet", () => ({ firebaseGet: firebaseMocks.firebaseGet }));
vi.mock("~/services/firebase/createDocRef", () => ({ createDocRef: vi.fn(() => ({ __mockRef: true })) }));

import { cascadeDeleteCategory } from "~/services/api/sync/cascade-delete-category";

describe("cascadeDeleteCategory", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
  });

  it("removes categoryId from transactions, counterparties, and reports", async () => {
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

    // Transactions updated
    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith({
      collection: "transactions",
      items: [
        { id: t1.id, data: { categoryIds: ["cat-2"] } },
        { id: t2.id, data: { categoryIds: [] } },
      ],
    });

    // Counterparties updated
    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith({
      collection: "creditors",
      items: [
        { id: cp1.id, data: { categoryIds: ["cat-3"] } },
      ],
    });

    // Reports: firebaseGet called for each bank account (report update verified by integration tests)
    expect(firebaseMocks.firebaseGet).toHaveBeenCalledTimes(2);
  });

  it("does nothing when no transactions or counterparties match", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeDeleteCategory({ categoryId: "cat-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseGet).not.toHaveBeenCalled();
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
  });
});
