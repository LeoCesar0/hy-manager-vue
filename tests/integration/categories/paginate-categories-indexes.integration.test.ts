import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  setupFirebaseIntegration,
  cleanupAllTestCollections,
} from "../../helpers/firebase-integration";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import type { ICategory } from "~/@schemas/models/category";
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

const seedCategories = async () => {
  const categories: Array<Record<string, unknown>> = [
    {
      id: "idx-cat-1",
      name: "Alimentação",
      color: "#ef4444",
      icon: "food",
      userId: TEST_USER_ID,
    },
    {
      id: "idx-cat-2",
      name: "Transporte",
      color: "#3b82f6",
      icon: "transport",
      userId: TEST_USER_ID,
    },
    {
      id: "idx-cat-3",
      name: "Moradia",
      color: "#22c55e",
      icon: "home",
      userId: TEST_USER_ID,
    },
  ];

  for (const data of categories) {
    await firebaseCreate<Record<string, unknown>, ICategory>({
      collection: "categories",
      data,
    });
  }
};

type FilterDef = {
  field: keyof ICategory;
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
];

describe("paginate-categories composite indexes (integration)", () => {
  beforeAll(async () => {
    setupFirebaseIntegration();
    await cleanupAllTestCollections();
    await seedCategories();
  });

  afterAll(async () => {
    await cleanupAllTestCollections();

    if (indexErrors.length > 0) {
      const content = [
        "# Missing Firestore Composite Indexes (Categories)",
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
        resolve(process.cwd(), "update-index-categories.md"),
        content,
        "utf-8"
      );
    }
  });

  for (const testCase of testCases) {
    it(`query with ${testCase.name}`, async () => {
      try {
        const result = await firebasePaginatedList<ICategory>({
          collection: "categories",
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
