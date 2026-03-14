import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
  resetFactoryCounter,
} from "../../helpers";

vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
vi.mock("~/services/firebase/firebaseDeleteMany", () => ({ firebaseDeleteMany: firebaseMocks.firebaseDeleteMany }));
vi.mock("~/services/firebase/firebaseDelete", () => ({ firebaseDelete: firebaseMocks.firebaseDelete }));

import { cascadeDeleteBankAccount } from "~/services/api/sync/cascade-delete-bank-account";

describe("cascadeDeleteBankAccount", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
  });

  it("deletes all transactions and the report for the bank account", async () => {
    const t1 = makeTransaction({ bankAccountId: "bank-1", id: "tx-1" });
    const t2 = makeTransaction({ bankAccountId: "bank-1", id: "tx-2" });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1, t2]);
    firebaseMocks.firebaseDeleteMany.mockResolvedValue(true);
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await cascadeDeleteBankAccount({ bankAccountId: "bank-1", userId: "user-1" });

    expect(firebaseMocks.firebaseDeleteMany).toHaveBeenCalledWith({
      collection: "transactions",
      ids: ["tx-1", "tx-2"],
    });

    expect(firebaseMocks.firebaseDelete).toHaveBeenCalledWith({
      collection: "reports",
      id: "bank-1",
    });
  });

  it("still deletes report when no transactions exist", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);
    firebaseMocks.firebaseDelete.mockResolvedValue(true);

    await cascadeDeleteBankAccount({ bankAccountId: "bank-1", userId: "user-1" });

    expect(firebaseMocks.firebaseDeleteMany).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseDelete).toHaveBeenCalledWith({
      collection: "reports",
      id: "bank-1",
    });
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
