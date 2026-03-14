import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
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
  return { ...actual, writeBatch: vi.fn(() => mockBatch) };
});

vi.stubGlobal("useFirebaseStore", () => ({ firebaseDB: {} }));

vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
vi.mock("~/services/firebase/firebaseDeleteMany", () => ({ firebaseDeleteMany: firebaseMocks.firebaseDeleteMany }));
vi.mock("~/services/firebase/firebaseDelete", () => ({ firebaseDelete: firebaseMocks.firebaseDelete }));

import { cascadeDeleteBankAccount } from "~/services/api/sync/cascade-delete-bank-account";

describe("cascadeDeleteBankAccount", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    mockBatch.commit.mockReset().mockResolvedValue(undefined);
    mockBatch.delete.mockReset();
    mockBatch.update.mockReset();
    mockBatch.set.mockReset();
  });

  it("deletes all transactions and the report in a single batch", async () => {
    const t1 = makeTransaction({ bankAccountId: "bank-1", id: "tx-1" });
    const t2 = makeTransaction({ bankAccountId: "bank-1", id: "tx-2" });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1, t2]);
    firebaseMocks.firebaseDeleteMany.mockResolvedValue(true);
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await cascadeDeleteBankAccount({ bankAccountId: "bank-1", userId: "user-1" });

    expect(firebaseMocks.firebaseDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        ids: ["tx-1", "tx-2"],
        batch: mockBatch,
      })
    );

    expect(firebaseMocks.firebaseDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "reports",
        id: "bank-1",
        batch: mockBatch,
      })
    );

    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("still deletes report when no transactions exist", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await cascadeDeleteBankAccount({ bankAccountId: "bank-1", userId: "user-1" });

    expect(firebaseMocks.firebaseDeleteMany).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "reports",
        id: "bank-1",
        batch: mockBatch,
      })
    );

    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("fetches transactions for the bank account", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await cascadeDeleteBankAccount({ bankAccountId: "bank-1", userId: "user-1" });

    expect(firebaseMocks.firebaseList).toHaveBeenCalledWith({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: "user-1" },
        { field: "bankAccountId", operator: "==", value: "bank-1" },
      ],
    });
  });
});
