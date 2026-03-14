import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { firebaseList } from "~/services/firebase/firebaseList";
import { cascadeDeleteBankAccount } from "~/services/api/sync/cascade-delete-bank-account";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IReport } from "~/@schemas/models/report";
import { Timestamp } from "firebase/firestore";

const TEST_USER_ID = "integration-test-user";

describe("cascadeDeleteBankAccount (integration)", () => {
  beforeAll(() => {
    setupFirebaseIntegration();
  });

  beforeEach(async () => {
    await cleanupAllTestCollections();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();
  });

  it("deletes all transactions and the report for the bank account", async () => {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-ba-1",
        type: "expense",
        amount: 100,
        description: "TX 1",
        date: Timestamp.now(),
        categoryIds: ["cat-1"],
        counterpartyId: null,
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-del",
      },
    });

    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-ba-2",
        type: "deposit",
        amount: 500,
        description: "TX 2",
        date: Timestamp.now(),
        categoryIds: ["cat-2"],
        counterpartyId: "cp-1",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-del",
      },
    });

    // Transaction on a DIFFERENT bank account — should NOT be deleted
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-ba-other",
        type: "expense",
        amount: 50,
        description: "Other bank TX",
        date: Timestamp.now(),
        categoryIds: ["cat-1"],
        counterpartyId: null,
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-keep",
      },
    });

    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-del",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-del",
        totalIncome: 500,
        totalExpenses: 100,
        transactionCount: 2,
        expensesByCategory: { "cat-1": 100 },
        depositsByCategory: { "cat-2": 500 },
        expensesByCounterparty: {},
        depositsByCounterparty: { "cp-1": 500 },
        monthlyBreakdown: {},
      },
    });

    await cascadeDeleteBankAccount({ bankAccountId: "int-bank-del", userId: TEST_USER_ID });

    // Transactions for int-bank-del should be gone
    await expect(
      firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-ba-1" })
    ).rejects.toThrow();

    await expect(
      firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-ba-2" })
    ).rejects.toThrow();

    // Report should be gone
    await expect(
      firebaseGet<IReport>({ collection: "reports", id: "int-bank-del" })
    ).rejects.toThrow();

    // Transaction on different bank account should still exist
    const otherTx = await firebaseGet<ITransaction>({
      collection: "transactions",
      id: "int-tx-ba-other",
    });
    expect(otherTx.description).toBe("Other bank TX");
  });

  it("handles bank account with no transactions", async () => {
    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-empty",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-empty",
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0,
        expensesByCategory: {},
        depositsByCategory: {},
        expensesByCounterparty: {},
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      },
    });

    await cascadeDeleteBankAccount({ bankAccountId: "int-bank-empty", userId: TEST_USER_ID });

    // Report deleted
    await expect(
      firebaseGet<IReport>({ collection: "reports", id: "int-bank-empty" })
    ).rejects.toThrow();
  });
});
