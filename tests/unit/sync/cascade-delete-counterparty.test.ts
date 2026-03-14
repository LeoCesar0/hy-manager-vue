import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
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

import { cascadeDeleteCounterparty } from "~/services/api/sync/cascade-delete-counterparty";

describe("cascadeDeleteCounterparty", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    mockBatch.commit.mockReset().mockResolvedValue(undefined);
    mockBatch.delete.mockReset();
    mockBatch.update.mockReset();
    mockBatch.set.mockReset();
  });

  it("nullifies counterpartyId on transactions and removes from reports in a single batch", async () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-1" });
    const t2 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-2" });
    const report1 = makeReport({ bankAccountId: "bank-1", expensesByCounterparty: { "cp-1": 100 } });
    const report2 = makeReport({ bankAccountId: "bank-2", expensesByCounterparty: { "cp-1": 50 } });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1, t2]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report1);
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report2);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        items: [
          { id: t1.id, data: { counterpartyId: null } },
          { id: t2.id, data: { counterpartyId: null } },
        ],
        batch: mockBatch,
      })
    );

    // Reports: batch.update called for each bank account
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no transactions match", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseGet).not.toHaveBeenCalled();
    // batch.commit is still called (empty batch is a no-op)
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("fetches transactions with counterpartyId filter", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseList).toHaveBeenCalledWith({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: "user-1" },
        { field: "counterpartyId", operator: "==", value: "cp-1" },
      ],
    });
  });

  it("handles report fetch failure gracefully", async () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-1" });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    firebaseMocks.firebaseGet.mockRejectedValueOnce(new Error("not found"));

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).not.toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});
