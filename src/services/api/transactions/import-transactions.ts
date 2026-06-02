import { Timestamp } from "firebase/firestore";
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type {
  ICounterparty,
  ICreateCounterparty,
} from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import type { IBankStatementRow } from "~/services/csv-import/@types";
import { firebaseCreateMany } from "~/services/firebase/firebaseCreateMany";
import { firebaseList } from "~/services/firebase/firebaseList";
import { slugify } from "~/helpers/slugify";
import { updateReportBulk } from "../reports/update-report-bulk";
import type { ICategory } from "~/@schemas/models/category";
import { resolveAutoCategoryId } from "~/services/csv-import/resolve-auto-category-id";

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
  rows,
  userId,
  bankAccountId,
}: {
  rows: IBankStatementRow[];
  userId: string;
  bankAccountId: string;
}): Promise<Set<string>> => {
  const skipIds = new Set<string>();
  if (rows.length === 0) return skipIds;

  // Single ranged read covering the whole import batch, used for BOTH the
  // id match and the field-based fallback. This replaces the previous
  // ceil(N/30) parallel `id in [...]` queries (67+ for a 2000-row statement).
  // It is sufficient because every row id encodes its own date — Inter ids are
  // `inter-{iso-date}-...` and Nubank ids map 1:1 to a dated transaction — so an
  // already-imported transaction sharing a row's id necessarily shares its date
  // and falls within [min,max]. (A same-id/different-date pair can't occur:
  // ids are deterministic/unique per transaction.)
  const timestamps = rows.map((r) => r.date.getTime());
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

  // 1. Exact id match (current-format ids).
  const existingIds = new Set(existingInRange.map((t) => t.id));
  for (const row of rows) {
    if (existingIds.has(row.id)) skipIds.add(row.id);
  }

  // 2. Field-based fallback for retrocompatibility with old-format IDs.
  //    Matches by (date, type, amount, description) so rows already imported
  //    under a different ID format are still detected as duplicates. Count-based
  //    so legitimately repeated transactions aren't over-skipped.
  const unmatchedRows = rows.filter((r) => !skipIds.has(r.id));
  if (unmatchedRows.length === 0) return skipIds;

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

  if (uniqueNewNames.length === 0) return counterpartyMap;

  // Create every new counterparty in a single chunked bulk write instead of one
  // sequential round-trip per name (100 new names previously meant 100 awaits).
  const newCounterpartiesData: ICreateCounterparty[] = uniqueNewNames.map(
    (name) => ({
      name: name.trim(),
      userId,
      categoryIds: resolveAutoCategoryId({
        counterpartyName: name,
        userCategories,
        enableKeywordMatch: selfDerivedNames.has(slugify(name)),
      }),
    })
  );

  const created = await firebaseCreateMany<
    (typeof newCounterpartiesData)[number],
    ICounterparty
  >({
    collection: "creditors",
    data: newCounterpartiesData,
  });

  for (const cp of created) {
    counterpartyMap.set(slugify(cp.name), cp);
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
      const skipIds = await checkExistingTransactions({
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
