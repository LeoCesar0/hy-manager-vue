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

vi.stubGlobal("useFirebaseStore", () => ({ firebaseDB: {} }));

vi.mock("~/services/firebase/cascadePaginatedBatch", () => ({
  cascadePaginatedBatch: firebaseMocks.cascadePaginatedBatch,
}));
vi.mock("~/services/firebase/firebaseDelete", () => ({ firebaseDelete: firebaseMocks.firebaseDelete }));
vi.mock("~/services/firebase/createDocRef", () => ({
  createDocRef: vi.fn(({ id }: { id: string }) => ({ __ref: id })),
}));

import { clearBankAccountTransactions } from "~/services/api/sync/clear-bank-account-transactions";

describe("clearBankAccountTransactions", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    mockBatch.commit.mockReset().mockResolvedValue(undefined);
    mockBatch.delete.mockReset();
    mockBatch.update.mockReset();
    mockBatch.set.mockReset();
  });

  it("paginates the transactions and calls delete on every item via the batch", async () => {
    const t1 = makeTransaction({ bankAccountId: "bank-1", id: "tx-1" });
    const t2 = makeTransaction({ bankAccountId: "bank-1", id: "tx-2" });

    firebaseMocks.cascadePaginatedBatch.mockImplementationOnce(
      async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof mockBatch }) => void | Promise<void> }) => {
        await onPage({ items: [t1, t2], batch: mockBatch });
      }
    );
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await clearBankAccountTransactions({ bankAccountId: "bank-1", userId: "user-1" });

    expect(firebaseMocks.cascadePaginatedBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        filters: [
          { field: "userId", operator: "==", value: "user-1" },
          { field: "bankAccountId", operator: "==", value: "bank-1" },
        ],
      })
    );
    expect(mockBatch.delete).toHaveBeenCalledTimes(2);
    expect(firebaseMocks.firebaseDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "reports", id: "bank-1" })
    );
  });

  it("still deletes report when no transactions exist (helper exits without invoking onPage)", async () => {
    firebaseMocks.cascadePaginatedBatch.mockResolvedValueOnce(undefined);
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await clearBankAccountTransactions({ bankAccountId: "bank-1", userId: "user-1" });

    expect(mockBatch.delete).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "reports", id: "bank-1" })
    );
  });
});
