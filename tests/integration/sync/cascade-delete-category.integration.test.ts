import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { firebaseList } from "~/services/firebase/firebaseList";
import { cascadeDeleteCategory } from "~/services/api/sync/cascade-delete-category";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ICategory } from "~/@schemas/models/category";
import type { IReport } from "~/@schemas/models/report";
import { Timestamp } from "firebase/firestore";

const TEST_USER_ID = "integration-test-user";

describe("cascadeDeleteCategory (integration)", () => {
  beforeAll(() => {
    setupFirebaseIntegration();
  });

  beforeEach(async () => {
    await cleanupAllTestCollections();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();
  });

  it("removes category from transactions, counterparties, and report", async () => {
    // Seed: create a category, counterparty, transactions, and a report
    const category = await firebaseCreate<Record<string, unknown>, ICategory>({
      collection: "categories",
      data: {
        id: "int-cat-1",
        name: "Food",
        color: "#ff0000",
        icon: "food",
        userId: TEST_USER_ID,
      },
    });

    await firebaseCreate<Record<string, unknown>, ICounterparty>({
      collection: "creditors",
      data: {
        id: "int-cp-1",
        name: "Supermarket",
        categoryIds: ["int-cat-1", "int-cat-2"],
        userId: TEST_USER_ID,
      },
    });

    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-1",
        type: "expense",
        amount: 50,
        description: "Groceries",
        date: Timestamp.now(),
        categoryIds: ["int-cat-1", "int-cat-2"],
        counterpartyId: "int-cp-1",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-1",
      },
    });

    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-2",
        type: "expense",
        amount: 30,
        description: "Snacks",
        date: Timestamp.now(),
        categoryIds: ["int-cat-1"],
        counterpartyId: null,
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-1",
      },
    });

    // Create report with category data
    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-1",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-1",
        totalIncome: 0,
        totalExpenses: 80,
        transactionCount: 2,
        expensesByCategory: { "int-cat-1": 80, "int-cat-2": 50 },
        depositsByCategory: {},
        expensesByCounterparty: { "int-cp-1": 50 },
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      },
    });

    // Act: cascade delete the category
    await cascadeDeleteCategory({ categoryId: "int-cat-1", userId: TEST_USER_ID });

    // Assert: transactions no longer have int-cat-1
    const tx1 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-1" });
    expect(tx1.categoryIds).toEqual(["int-cat-2"]);

    const tx2 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-2" });
    expect(tx2.categoryIds).toEqual([]);

    // Assert: counterparty no longer has int-cat-1
    const cp = await firebaseGet<ICounterparty>({ collection: "creditors", id: "int-cp-1" });
    expect(cp.categoryIds).toEqual(["int-cat-2"]);

    // Assert: report no longer has int-cat-1 key, but other data preserved
    const report = await firebaseGet<IReport>({ collection: "reports", id: "int-bank-1" });
    expect(report.expensesByCategory).not.toHaveProperty("int-cat-1");
    expect(report.expensesByCategory["int-cat-2"]).toBe(50);
    expect(report.totalExpenses).toBe(80); // totals unchanged
    expect(report.expensesByCounterparty["int-cp-1"]).toBe(50); // counterparty data unchanged
  });

  it("handles no matching data gracefully", async () => {
    // Act: cascade with a category that doesn't exist in any entity
    await cascadeDeleteCategory({ categoryId: "nonexistent-cat", userId: TEST_USER_ID });

    // No error thrown — just a no-op
  });

  it("handles transactions across multiple bank accounts", async () => {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-multi-1",
        type: "expense",
        amount: 100,
        description: "TX Bank 1",
        date: Timestamp.now(),
        categoryIds: ["int-cat-multi"],
        counterpartyId: null,
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-multi-1",
      },
    });

    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data: {
        id: "int-tx-multi-2",
        type: "deposit",
        amount: 200,
        description: "TX Bank 2",
        date: Timestamp.now(),
        categoryIds: ["int-cat-multi", "int-cat-other"],
        counterpartyId: null,
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-multi-2",
      },
    });

    // Create reports for both bank accounts
    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-multi-1",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-multi-1",
        totalIncome: 0,
        totalExpenses: 100,
        transactionCount: 1,
        expensesByCategory: { "int-cat-multi": 100 },
        depositsByCategory: {},
        expensesByCounterparty: {},
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      },
    });

    await firebaseCreate<Record<string, unknown>, IReport>({
      collection: "reports",
      data: {
        id: "int-bank-multi-2",
        userId: TEST_USER_ID,
        bankAccountId: "int-bank-multi-2",
        totalIncome: 200,
        totalExpenses: 0,
        transactionCount: 1,
        expensesByCategory: {},
        depositsByCategory: { "int-cat-multi": 200, "int-cat-other": 200 },
        expensesByCounterparty: {},
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      },
    });

    await cascadeDeleteCategory({ categoryId: "int-cat-multi", userId: TEST_USER_ID });

    // Both transactions updated
    const tx1 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-multi-1" });
    expect(tx1.categoryIds).toEqual([]);

    const tx2 = await firebaseGet<ITransaction>({ collection: "transactions", id: "int-tx-multi-2" });
    expect(tx2.categoryIds).toEqual(["int-cat-other"]);

    // Both reports updated
    const report1 = await firebaseGet<IReport>({ collection: "reports", id: "int-bank-multi-1" });
    expect(report1.expensesByCategory).not.toHaveProperty("int-cat-multi");

    const report2 = await firebaseGet<IReport>({ collection: "reports", id: "int-bank-multi-2" });
    expect(report2.depositsByCategory).not.toHaveProperty("int-cat-multi");
    expect(report2.depositsByCategory["int-cat-other"]).toBe(200);
  });
});
