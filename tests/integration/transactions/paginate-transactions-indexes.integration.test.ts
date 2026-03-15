import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IPaginationBody } from "~/@types/pagination";
import { Timestamp } from "firebase/firestore";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_USER_ID = "integration-test-user";

const basePagination: IPaginationBody = {
  page: 1,
  limit: 10,
  orderBy: { field: "date", direction: "desc" },
};

const dateFrom = Timestamp.fromDate(new Date("2025-01-01"));
const dateTo = Timestamp.fromDate(new Date("2025-12-31"));

type IndexError = {
  combination: string;
  message: string;
};

const indexErrors: IndexError[] = [];

const seedTransactions = async () => {
  const transactions: Array<Record<string, unknown>> = [
    {
      id: "idx-tx-1",
      type: "expense",
      amount: 100,
      description: "Test expense",
      date: Timestamp.fromDate(new Date("2025-06-15")),
      categoryIds: ["cat-1"],
      counterpartyId: "cp-1",
      userId: TEST_USER_ID,
      bankAccountId: "bank-1",
    },
    {
      id: "idx-tx-2",
      type: "deposit",
      amount: 500,
      description: "Test deposit",
      date: Timestamp.fromDate(new Date("2025-07-20")),
      categoryIds: ["cat-2"],
      counterpartyId: "cp-2",
      userId: TEST_USER_ID,
      bankAccountId: "bank-2",
    },
    {
      id: "idx-tx-3",
      type: "expense",
      amount: 200,
      description: "Another expense",
      date: Timestamp.fromDate(new Date("2025-08-10")),
      categoryIds: ["cat-1", "cat-2"],
      counterpartyId: "cp-1",
      userId: TEST_USER_ID,
      bankAccountId: "bank-1",
    },
  ];

  for (const data of transactions) {
    await firebaseCreate<Record<string, unknown>, ITransaction>({
      collection: "transactions",
      data,
    });
  }
};

type FilterDef = {
  field: keyof ITransaction;
  operator?: "==" | ">=" | "<=" | "array-contains";
  value: unknown;
};

type TestCase = {
  name: string;
  filters: FilterDef[];
};

const testCases: TestCase[] = [
  {
    name: "1. userId only",
    filters: [{ field: "userId", value: TEST_USER_ID }],
  },
  {
    name: "2. date >= X",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "date", operator: ">=", value: dateFrom },
    ],
  },
  {
    name: "3. date >= X, date <= X",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "4. type == expense",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
    ],
  },
  {
    name: "5. categoryIds array-contains",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
    ],
  },
  {
    name: "6. counterpartyId == cp-1",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "counterpartyId", value: "cp-1" },
    ],
  },
  {
    name: "7. bankAccountId == bank-1",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "bankAccountId", value: "bank-1" },
    ],
  },
  {
    name: "8. type + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "9. category + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "10. counterparty + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "counterpartyId", value: "cp-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "11. bankAccount + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "bankAccountId", value: "bank-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "12. type + category",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
    ],
  },
  {
    name: "13. type + counterparty",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "counterpartyId", value: "cp-1" },
    ],
  },
  {
    name: "14. type + bankAccount",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "bankAccountId", value: "bank-1" },
    ],
  },
  {
    name: "15. type + category + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "16. type + counterparty + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "counterpartyId", value: "cp-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "17. type + bankAccount + date range",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "bankAccountId", value: "bank-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
  {
    name: "18. category + counterparty",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
      { field: "counterpartyId", value: "cp-1" },
    ],
  },
  {
    name: "19. category + bankAccount",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
      { field: "bankAccountId", value: "bank-1" },
    ],
  },
  {
    name: "20. all filters combined",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "type", value: "expense" },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
      { field: "counterpartyId", value: "cp-1" },
      { field: "bankAccountId", value: "bank-1" },
      { field: "date", operator: ">=", value: dateFrom },
      { field: "date", operator: "<=", value: dateTo },
    ],
  },
];

describe("paginate-transactions composite indexes (integration)", () => {
  beforeAll(async () => {
    setupFirebaseIntegration();
    await cleanupAllTestCollections();
    await seedTransactions();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();

    if (indexErrors.length > 0) {
      const content = [
        "# Missing Firestore Composite Indexes",
        "",
        `Generated at: ${new Date().toISOString()}`,
        "",
        "The following filter combinations require composite indexes that are not yet created.",
        "Click the links in the error messages to create them in the Firebase console.",
        "",
        ...indexErrors.map(
          (err) =>
            `## ${err.combination}\n\n\`\`\`\n${err.message}\n\`\`\`\n`
        ),
      ].join("\n");

      writeFileSync(
        resolve(process.cwd(), "update-index.md"),
        content,
        "utf-8"
      );
    }
  });

  for (const testCase of testCases) {
    it(`query with ${testCase.name}`, async () => {
      try {
        const result = await firebasePaginatedList<ITransaction>({
          collection: "transactions",
          filters: testCase.filters.map((f) => ({
            field: f.field,
            operator: f.operator ?? "==",
            value: f.value,
          })),
          pagination: basePagination,
        });

        expect(result).toBeDefined();
        expect(result.list).toBeDefined();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        const isIndexError =
          message.includes("index") || message.includes("indexes");

        if (isIndexError) {
          indexErrors.push({
            combination: testCase.name,
            message,
          });
        }

        throw error;
      }
    });
  }
});
