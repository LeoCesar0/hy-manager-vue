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

import { cascadeDeleteCounterparty } from "~/services/api/sync/cascade-delete-counterparty";

describe("cascadeDeleteCounterparty", () => {
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

  it("nullifies counterpartyId on transactions and removes from reports", async () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-1" });
    const t2 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-2" });
    const report1 = makeReport({ bankAccountId: "bank-1", expensesByCounterparty: { "cp-1": 100 } });
    const report2 = makeReport({ bankAccountId: "bank-2", expensesByCounterparty: { "cp-1": 50 } });

    firebaseMocks.cascadePaginatedBatch.mockImplementationOnce(
      async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
        await onPage({ items: [t1, t2], batch: pageBatch });
      }
    );
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report1).mockResolvedValueOnce(report2);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    // Per-page batch received the tx updates
    expect(pageBatch.update).toHaveBeenCalledTimes(2);

    // Report updates land on the separate report batch, one commit
    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no transactions match (no report batch committed)", async () => {
    firebaseMocks.cascadePaginatedBatch.mockResolvedValueOnce(undefined);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseGet).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("fetches transactions with counterpartyId filter", async () => {
    firebaseMocks.cascadePaginatedBatch.mockResolvedValueOnce(undefined);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.cascadePaginatedBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        filters: [
          { field: "userId", operator: "==", value: "user-1" },
          { field: "counterpartyId", operator: "==", value: "cp-1" },
        ],
      })
    );
  });

  it("handles report fetch failure gracefully", async () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-1" });

    firebaseMocks.cascadePaginatedBatch.mockImplementationOnce(
      async ({ onPage }: { onPage: (args: { items: unknown[]; batch: typeof pageBatch }) => void | Promise<void> }) => {
        await onPage({ items: [t1], batch: pageBatch });
      }
    );
    firebaseMocks.firebaseGet.mockRejectedValueOnce(new Error("not found"));

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(pageBatch.update).toHaveBeenCalledTimes(1);
    expect(mockBatch.update).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
