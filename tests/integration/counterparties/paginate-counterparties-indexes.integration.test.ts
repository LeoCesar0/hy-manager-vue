import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IPaginationBody } from "~/@types/pagination";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_USER_ID = "integration-test-user";

const basePagination: IPaginationBody = {
  page: 1,
  limit: 10,
  orderBy: { field: "name", direction: "asc" },
};

type IndexError = {
  combination: string;
  message: string;
};

const indexErrors: IndexError[] = [];

const seedCounterparties = async () => {
  const counterparties: Array<Record<string, unknown>> = [
    {
      id: "idx-cp-1",
      name: "Supermercado ABC",
      categoryIds: ["cat-1"],
      userId: TEST_USER_ID,
    },
    {
      id: "idx-cp-2",
      name: "Posto de Gasolina",
      categoryIds: ["cat-2"],
      userId: TEST_USER_ID,
    },
    {
      id: "idx-cp-3",
      name: "Farmácia Central",
      categoryIds: ["cat-1", "cat-3"],
      userId: TEST_USER_ID,
    },
  ];

  for (const data of counterparties) {
    await firebaseCreate<Record<string, unknown>, ICounterparty>({
      collection: "creditors",
      data,
    });
  }
};

type FilterDef = {
  field: keyof ICounterparty;
  operator?: "==" | ">=" | "<=" | "array-contains";
  value: unknown;
};

type TestCase = {
  name: string;
  filters: FilterDef[];
  pagination?: IPaginationBody;
};

const testCases: TestCase[] = [
  {
    name: "1. userId only (ordered by name asc)",
    filters: [{ field: "userId", value: TEST_USER_ID }],
  },
  {
    name: "2. userId only (ordered by name desc)",
    filters: [{ field: "userId", value: TEST_USER_ID }],
    pagination: { ...basePagination, orderBy: { field: "name", direction: "desc" } },
  },
  {
    name: "3. userId only (ordered by createdAt desc)",
    filters: [{ field: "userId", value: TEST_USER_ID }],
    pagination: { ...basePagination, orderBy: { field: "createdAt", direction: "desc" } },
  },
  {
    name: "4. userId + categoryIds array-contains (ordered by name asc)",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
    ],
  },
  {
    name: "5. userId + categoryIds array-contains (ordered by name desc)",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
    ],
    pagination: { ...basePagination, orderBy: { field: "name", direction: "desc" } },
  },
  {
    name: "6. userId + categoryIds array-contains (ordered by createdAt desc)",
    filters: [
      { field: "userId", value: TEST_USER_ID },
      { field: "categoryIds", operator: "array-contains", value: "cat-1" },
    ],
    pagination: { ...basePagination, orderBy: { field: "createdAt", direction: "desc" } },
  },
];

describe("paginate-counterparties composite indexes (integration)", () => {
  beforeAll(async () => {
    setupFirebaseIntegration();
    await cleanupAllTestCollections();
    await seedCounterparties();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();

    if (indexErrors.length > 0) {
      const content = [
        "# Missing Firestore Composite Indexes (Counterparties)",
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
        resolve(process.cwd(), "update-index-counterparties.md"),
        content,
        "utf-8"
      );
    }
  });

  for (const testCase of testCases) {
    it(`query with ${testCase.name}`, async () => {
      try {
        const result = await firebasePaginatedList<ICounterparty>({
          collection: "creditors",
          filters: testCase.filters.map((f) => ({
            field: f.field,
            operator: f.operator ?? "==",
            value: f.value,
          })),
          pagination: testCase.pagination ?? basePagination,
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
