import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { cascadeUpdateCounterpartyCategoryIds } from "~/services/api/sync/cascade-update-counterparty-category-ids";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IReport } from "~/@schemas/models/report";
import { Timestamp } from "firebase/firestore";

const TEST_USER_ID = "integration-test-user";

describe("cascadeUpdateCounterpartyCategoryIds (integration)", () => {
  beforeAll(() => {
    setupFirebaseIntegration();
  });

  beforeEach(async () => {
    await cleanupAllTestCollections();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();
  });

  it("adds new categories and removes old ones from matching transactions", async () => {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-upd-1",
        type: "expense",
        amount: 100,
        description: "Vendor payment",
        date: Timestamp.now(),
        categoryIds: ["cat-old-1", "cat-keep"],
        counterpartyId: "int-cp-upd",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-upd",
      },
    });

    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-upd-2",
        type: "expense",
        amount: 50,
        description: "Another payment",
        date: Timestamp.now(),
        categoryIds: ["cat-old-1"],
        counterpartyId: "int-cp-upd",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-upd",
      },
    });

    // Transaction with different counterparty — should NOT be affected
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-upd-3",
        type: "expense",
        amount: 75,
        description: "Other counterparty",
        date: Timestamp.now(),
        categoryIds: ["cat-old-1"],
        counterpartyId: "int-cp-other",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-upd",
      },
    });

    // Create report — will be rebuilt from transactions
    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-upd",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-upd",
        totalIncome: 0,
        totalExpenses: 225,
        transactionCount: 3,
        expensesByCategory: { "cat-old-1": 225, "cat-keep": 100 },
        depositsByCategory: {},
        expensesByCounterparty: { "int-cp-upd": 150, "int-cp-other": 75 },
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      },
    });

    // Act: counterparty categories changed from [cat-old-1] to [cat-new-1]
    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "int-cp-upd",
      oldCategoryIds: ["cat-old-1"],
      newCategoryIds: ["cat-new-1"],
      userId: TEST_USER_ID,
    });

    // Assert: matching transactions have cat-old-1 replaced with cat-new-1
    const tx1 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-upd-1" });
    expect(tx1.categoryIds).toContain("cat-new-1");
    expect(tx1.categoryIds).toContain("cat-keep");
    expect(tx1.categoryIds).not.toContain("cat-old-1");

    const tx2 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-upd-2" });
    expect(tx2.categoryIds).toContain("cat-new-1");
    expect(tx2.categoryIds).not.toContain("cat-old-1");

    // Transaction with different counterparty should be unchanged
    const tx3 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-upd-3" });
    expect(tx3.categoryIds).toEqual(["cat-old-1"]);

    // Report should be rebuilt (rebuilds from all transactions in bank account)
    const report = await firebaseGet<IReport>({ collection: "reports", id: "int-bank-upd" });
    expect(report.transactionCount).toBe(3);
    expect(report.totalExpenses).toBe(225);
    // Category breakdown should now reflect cat-new-1 for the updated transactions
    expect(report.expensesByCategory).toHaveProperty("cat-new-1");
    expect(report.expensesByCategory).toHaveProperty("cat-keep");
    expect(report.expensesByCategory).toHaveProperty("cat-old-1"); // tx3 still has cat-old-1
  });

  it("no-ops when categoryIds have not changed", async () => {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-noop",
        type: "expense",
        amount: 100,
        description: "No change",
        date: Timestamp.now(),
        categoryIds: ["cat-1"],
        counterpartyId: "int-cp-noop",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-noop",
      },
    });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "int-cp-noop",
      oldCategoryIds: ["cat-1"],
      newCategoryIds: ["cat-1"],
      userId: TEST_USER_ID,
    });

    // Transaction should be untouched
    const tx = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-noop" });
    expect(tx.categoryIds).toEqual(["cat-1"]);
  });

  it("handles addition-only scenario (no removals)", async () => {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-add",
        type: "expense",
        amount: 80,
        description: "Add only",
        date: Timestamp.now(),
        categoryIds: ["cat-existing"],
        counterpartyId: "int-cp-add",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-add",
      },
    });

    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-add",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-add",
        totalIncome: 0,
        totalExpenses: 80,
        transactionCount: 1,
        expensesByCategory: { "cat-existing": 80 },
        depositsByCategory: {},
        expensesByCounterparty: { "int-cp-add": 80 },
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      },
    });

    await cascadeUpdateCounterpartyCategoryIds({
      counterpartyId: "int-cp-add",
      oldCategoryIds: ["cat-existing"],
      newCategoryIds: ["cat-existing", "cat-new"],
      userId: TEST_USER_ID,
    });

    const tx = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-add" });
    expect(tx.categoryIds).toContain("cat-existing");
    expect(tx.categoryIds).toContain("cat-new");
  });
});
