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

const checkExistingTransactions = async ({
  ids,
  userId,
  bankAccountId,
}: {
  ids: string[];
  userId: string;
  bankAccountId: string;
}): Promise<Set<string>> => {
  console.log(`❗ checkExistingTransactions -->`);
  const existingIds = new Set<string>();

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
        existingIds.add(transaction.id);
      }
    }
  }

  return existingIds;
};

const resolveCounterparties = async ({
  names,
  userId,
}: {
  names: string[];
  userId: string;
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
    const result = await createCounterparty({
      data: {
        name: name.trim(),
        userId,
        categoryIds: [],
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
  console.log('❗❗❗ importTransactions');
  const response = await handleAppRequest(
    async () => {
      const rowIds = rows.map((r) => r.id);
      const existingIds = await checkExistingTransactions({
        ids: rowIds,
        userId,
        bankAccountId,
      });
      const newRows = rows.filter((r) => !existingIds.has(r.id));

      if (newRows.length === 0) {
        return {
          created: [],
          skipped: rows.length,
        } satisfies IImportResult;
      }

      const counterpartyNames = newRows
        .map((r) => r.counterpartyName)
        .filter((name): name is string => !!name);

      const counterpartyMap = await resolveCounterparties({
        names: counterpartyNames,
        userId,
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

      updateReportBulk({
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
