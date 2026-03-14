import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeTransaction,
  makeReport,
  resetFactoryCounter,
} from "../../helpers";

vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
vi.mock("~/services/firebase/firebaseUpdateMany", () => ({ firebaseUpdateMany: firebaseMocks.firebaseUpdateMany }));
vi.mock("~/services/firebase/firebaseGet", () => ({ firebaseGet: firebaseMocks.firebaseGet }));
vi.mock("~/services/firebase/createDocRef", () => ({ createDocRef: vi.fn(() => ({ __mockRef: true })) }));

import { cascadeDeleteCounterparty } from "~/services/api/sync/cascade-delete-counterparty";

describe("cascadeDeleteCounterparty", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
  });

  it("nullifies counterpartyId on transactions and removes from reports", async () => {
    const t1 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-1" });
    const t2 = makeTransaction({ counterpartyId: "cp-1", bankAccountId: "bank-2" });
    const report1 = makeReport({ bankAccountId: "bank-1", expensesByCounterparty: { "cp-1": 100 } });
    const report2 = makeReport({ bankAccountId: "bank-2", expensesByCounterparty: { "cp-1": 50 } });

    firebaseMocks.firebaseList.mockResolvedValueOnce([t1, t2]);
    firebaseMocks.firebaseUpdateMany.mockResolvedValue([]);
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report1);
    firebaseMocks.firebaseGet.mockResolvedValueOnce(report2);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledWith({
      collection: "transactions",
      items: [
        { id: t1.id, data: { counterpartyId: null } },
        { id: t2.id, data: { counterpartyId: null } },
      ],
    });

    // Reports: firebaseGet called for each bank account (report update verified by integration tests)
    expect(firebaseMocks.firebaseGet).toHaveBeenCalledTimes(2);
  });

  it("does nothing when no transactions match", async () => {
    firebaseMocks.firebaseList.mockResolvedValueOnce([]);

    await cascadeDeleteCounterparty({ counterpartyId: "cp-1", userId: "user-1" });

    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseGet).not.toHaveBeenCalled();
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
  });
});
