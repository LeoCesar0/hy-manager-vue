import { Timestamp } from "firebase/firestore";
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import type { IBankStatementRow } from "~/services/csv-import/@types";
import { firebaseCreateMany } from "~/services/firebase/firebaseCreateMany";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getTransactions } from "./get-transactions";
import { createCounterparty } from "../counterparties/create-counterparty";
import { slugify } from "~/helpers/slugify";
import { chunk } from "~/helpers/chunk";
import { updateReportBulk } from "../reports/update-report-bulk";
import type { ICategory } from "~/@schemas/models/category";
import { resolveAutoCategoryId } from "~/services/csv-import/resolve-auto-category-id";

const FIRESTORE_IN_LIMIT = 30;

type IImportResult = {
  created: ITransaction[];
  skipped: number;
};

type IProps = {
  rows: IBankStatementRow[];
  userId: string;
  bankAccountId: string;
} & IAPIRequestCommon<IImportResult>;

const buildFieldDedupKey = ({
  dateIso,
  type,
  amount,
  description,
}: {
  dateIso: string;
  type: string;
  amount: number;
  description: string;
}): string => {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${dateIso}-${type}-${amount.toFixed(2)}-${slug}`;
};

const checkExistingTransactions = async ({
  ids,
  rows,
  userId,
  bankAccountId,
}: {
  ids: string[];
  rows: IBankStatementRow[];
  userId: string;
  bankAccountId: string;
}): Promise<Set<string>> => {
  const skipIds = new Set<string>();

  // 1. Check by ID (handles current-format IDs)
  const batches = chunk({ items: ids, size: FIRESTORE_IN_LIMIT });

  const results = await Promise.all(
    batches.map((batchIds) =>
      getTransactions({
        userId,
        bankAccountId,
        filters: [{ field: "id", operator: "in", value: batchIds }],
        options: {
          toastOptions: { loading: false, success: false, error: false },
        },
      })
    )
  );

  for (const result of results) {
    if (result.data) {
      for (const transaction of result.data) {
        skipIds.add(transaction.id);
      }
    }
  }

  // 2. Field-based fallback for retrocompatibility with old-format IDs.
  //    Queries existing transactions in the import date range and matches
  //    by (date, type, amount, description) so that rows already imported
  //    under a different ID format are still detected as duplicates.
  const unmatchedRows = rows.filter((r) => !skipIds.has(r.id));
  if (unmatchedRows.length === 0) return skipIds;

  const timestamps = unmatchedRows.map((r) => r.date.getTime());
  const minDate = new Date(Math.min(...timestamps));
  const maxDate = new Date(Math.max(...timestamps));
  maxDate.setHours(23, 59, 59, 999);

  const existingInRange = await firebaseList<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "bankAccountId", operator: "==", value: bankAccountId },
      { field: "date", operator: ">=", value: Timestamp.fromDate(minDate) },
      { field: "date", operator: "<=", value: Timestamp.fromDate(maxDate) },
    ],
  });

  if (existingInRange.length === 0) return skipIds;

  const existingCounts = new Map<string, number>();
  for (const t of existingInRange) {
    const key = buildFieldDedupKey({
      dateIso: t.date.toDate().toISOString().slice(0, 10),
      type: t.type,
      amount: t.amount,
      description: t.description,
    });
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  const importCounts = new Map<string, number>();
  for (const row of unmatchedRows) {
    const key = buildFieldDedupKey({
      dateIso: row.date.toISOString().slice(0, 10),
      type: row.type,
      amount: row.amount,
      description: row.description,
    });
    const seen = importCounts.get(key) ?? 0;
    const existing = existingCounts.get(key) ?? 0;

    if (seen < existing) {
      skipIds.add(row.id);
    }
    importCounts.set(key, seen + 1);
  }

  return skipIds;
};

const resolveCounterparties = async ({
  names,
  userId,
  userCategories,
  selfDerivedNames,
}: {
  names: string[];
  userId: string;
  userCategories: ICategory[];
  selfDerivedNames: Set<string>;
}): Promise<Map<string, ICounterparty>> => {
  const counterpartyMap = new Map<string, ICounterparty>();

  const existing = await firebaseList<ICounterparty>({
    collection: "creditors",
    filters: [{ field: "userId", operator: "==", value: userId }],
  });

  for (const cp of existing) {
    counterpartyMap.set(slugify(cp.name), cp);
  }

  const uniqueNewNames = [
    ...new Set(
      names.filter((name) => !counterpartyMap.has(slugify(name)))
    ),
  ];

  for (const name of uniqueNewNames) {
    const categoryIds = resolveAutoCategoryId({
      counterpartyName: name,
      userCategories,
      enableKeywordMatch: selfDerivedNames.has(slugify(name)),
    });

    const result = await createCounterparty({
      data: {
        name: name.trim(),
        userId,
        categoryIds,
      },
      options: {
        toastOptions: {
          loading: false,
          success: false,
          error: false,
        },
      },
    });

    if (result.data) {
      counterpartyMap.set(slugify(result.data.name), result.data);
    }
  }

  return counterpartyMap;
};

export const importTransactions = async ({
  rows,
  userId,
  bankAccountId,
  options,
}: IProps) => {
  const response = await handleAppRequest(
    async () => {
      const rowIds = rows.map((r) => r.id);
      const skipIds = await checkExistingTransactions({
        ids: rowIds,
        rows,
        userId,
        bankAccountId,
      });
      const newRows = rows.filter((r) => !skipIds.has(r.id));

      if (newRows.length === 0) {
        return {
          created: [],
          skipped: rows.length,
        } satisfies IImportResult;
      }

      const counterpartyNames = newRows
        .map((r) => r.counterpartyName)
        .filter((name): name is string => !!name);

      const selfDerivedNames = new Set(
        newRows
          .filter((r) => r.counterpartyName && r.counterpartyName === r.description)
          .map((r) => slugify(r.counterpartyName!))
      );

      const userCategories = await firebaseList<ICategory>({
        collection: "categories",
        filters: [{ field: "userId", operator: "==", value: userId }],
      });

      const counterpartyMap = await resolveCounterparties({
        names: counterpartyNames,
        userId,
        userCategories,
        selfDerivedNames,
      });

      const transactionsData = newRows.map((row) => {
        const counterparty = row.counterpartyName
          ? counterpartyMap.get(slugify(row.counterpartyName))
          : null;


        return {
          id: row.id,
          type: row.type,
          amount: row.amount,
          description: row.description,
          date: Timestamp.fromDate(row.date),
          categoryIds: counterparty?.categoryIds || [],
          counterpartyId: counterparty?.id || null,
          userId,
          bankAccountId,
        };
      });

      const created = await firebaseCreateMany<
        (typeof transactionsData)[number],
        ITransaction
      >({
        collection: "transactions",
        data: transactionsData,
      });

      await updateReportBulk({
        userId,
        bankAccountId,
        newTransactions: created,
      });

      return {
        created,
        skipped: rows.length - newRows.length,
      } satisfies IImportResult;
    },
    {
      toastOptions: {
        loading: { message: "Importando transações..." },
        success: { message: "Transações importadas com sucesso!" },
        error: true,
      },
      ...options,
    }
  );

  return response;
};
