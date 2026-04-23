import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreateMany } from "~/services/firebase/firebaseCreateMany";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
import { firebaseDeleteMany } from "~/services/firebase/firebaseDeleteMany";
import { firebaseList } from "~/services/firebase/firebaseList";
import type { ITransaction } from "~/@schemas/models/transaction";
import { Timestamp } from "firebase/firestore";

const TEST_USER_ID = "chunking-test-user";
const TEST_BANK = "chunking-test-bank";
const TOTAL = 501;

const buildTransaction = (i: number): Record<string, unknown> => ({
  id: `chunk-tx-${i}`,
  type: "expense",
  amount: i,
  description: `chunked-${i}`,
  date: Timestamp.now(),
  categoryIds: ["cat-1"],
  counterpartyId: null,
  userId: TEST_USER_ID,
  bankAccountId: TEST_BANK,
});

describe("firebase*Many chunking at 500-op boundary (integration)", () => {
  beforeAll(() => {
    setupFirebaseIntegration();
  });

  beforeEach(async () => {
    await cleanupAllTestCollections();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();
  });

  it("firebaseCreateMany, firebaseUpdateMany, firebaseDeleteMany all succeed past 500 ops", async () => {
    const data = Array.from({ length: TOTAL }, (_, i) => buildTransaction(i));

    await firebaseCreateMany<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data,
    });

    const afterCreate = await firebaseList<ITransaction>({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: TEST_USER_ID },
        { field: "bankAccountId", operator: "==", value: TEST_BANK },
      ],
    });
    expect(afterCreate).toHaveLength(TOTAL);

    await firebaseUpdateMany<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      items: afterCreate.map((tx) => ({ id: tx.id, data: { description: "updated" } })),
    });

    const afterUpdate = await firebaseList<ITransaction>({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: TEST_USER_ID },
        { field: "bankAccountId", operator: "==", value: TEST_BANK },
      ],
    });
    expect(afterUpdate).toHaveLength(TOTAL);
    expect(afterUpdate.every((t) => t.description === "updated")).toBe(true);

    await firebaseDeleteMany({
      collection: "transactions",
      ids: afterUpdate.map((t) => t.id),
    });

    const afterDelete = await firebaseList<ITransaction>({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: TEST_USER_ID },
        { field: "bankAccountId", operator: "==", value: TEST_BANK },
      ],
    });
    expect(afterDelete).toHaveLength(0);
  }, 120_000);
});
