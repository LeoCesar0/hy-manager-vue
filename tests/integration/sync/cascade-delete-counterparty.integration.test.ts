import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { cascadeDeleteCounterparty } from "~/services/api/sync/cascade-delete-counterparty";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IReport } from "~/@schemas/models/report";
import { Timestamp } from "firebase/firestore";

const TEST_USER_ID = "integration-test-user";

describe("cascadeDeleteCounterparty (integration)", () => {
  beforeAll(() => {
    setupFirebaseIntegration();
  });

  beforeEach(async () => {
    await cleanupAllTestCollections();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();
  });

  it("nullifies counterpartyId on transactions and removes from report", async () => {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-cp-1",
        type: "expense",
        amount: 100,
        description: "Payment to vendor",
        date: Timestamp.now(),
        categoryIds: ["cat-1"],
        counterpartyId: "int-cp-del",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-cp",
      },
    });

    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-cp-2",
        type: "deposit",
        amount: 200,
        description: "Refund from vendor",
        date: Timestamp.now(),
        categoryIds: ["cat-2"],
        counterpartyId: "int-cp-del",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-cp",
      },
    });

    // Transaction with different counterparty — should NOT be affected
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-cp-3",
        type: "expense",
        amount: 50,
        description: "Other vendor",
        date: Timestamp.now(),
        categoryIds: ["cat-1"],
        counterpartyId: "int-cp-other",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-cp",
      },
    });

    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-cp",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-cp",
        totalIncome: 200,
        totalExpenses: 150,
        transactionCount: 3,
        expensesByCategory: { "cat-1": 150 },
        depositsByCategory: { "cat-2": 200 },
        expensesByCounterparty: { "int-cp-del": 100, "int-cp-other": 50 },
        depositsByCounterparty: { "int-cp-del": 200 },
        monthlyBreakdown: {},
      },
    });

    await cascadeDeleteCounterparty({ counterpartyId: "int-cp-del", userId: TEST_USER_ID });

    // Transactions with int-cp-del should have null counterpartyId
    const tx1 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-cp-1" });
    expect(tx1.counterpartyId).toBeNull();

    const tx2 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-cp-2" });
    expect(tx2.counterpartyId).toBeNull();

    // Transaction with different counterparty should be unchanged
    const tx3 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-cp-3" });
    expect(tx3.counterpartyId).toBe("int-cp-other");

    // Report should not have int-cp-del, but int-cp-other preserved
    const report = await firebaseGet<IReport>({ collection: "reports", id: "int-bank-cp" });
    expect(report.expensesByCounterparty).not.toHaveProperty("int-cp-del");
    expect(report.depositsByCounterparty).not.toHaveProperty("int-cp-del");
    expect(report.expensesByCounterparty["int-cp-other"]).toBe(50);
    // Totals and categories unchanged
    expect(report.totalIncome).toBe(200);
    expect(report.totalExpenses).toBe(150);
    expect(report.expensesByCategory["cat-1"]).toBe(150);
  });

  it("handles no matching transactions gracefully", async () => {
    await cascadeDeleteCounterparty({ counterpartyId: "nonexistent-cp", userId: TEST_USER_ID });
    // No error thrown
  });
});
