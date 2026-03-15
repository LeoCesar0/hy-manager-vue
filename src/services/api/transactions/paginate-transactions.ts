import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { Timestamp } from "firebase/firestore";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import type { IAPIRequestCommon } from "../@types";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ITransaction;

export type IAPIPaginateTransactions = {
  userId: string;
  search?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryId?: string;
  counterpartyId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
  pagination: IPaginationBody;
} & IAPIRequestCommon<IPaginationResult<Item>>;

const buildFilters = (props: {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryId?: string;
  counterpartyId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
}): FirebaseFilterFor<ITransaction>[] => {
  const filters: FirebaseFilterFor<ITransaction>[] = [
    { field: "userId", operator: "==", value: props.userId },
  ];

  if (props.startDate) {
    filters.push({ field: "date", operator: ">=", value: props.startDate });
  }

  if (props.endDate) {
    filters.push({ field: "date", operator: "<=", value: props.endDate });
  }

  if (props.categoryId) {
    filters.push({ field: "categoryIds", operator: "array-contains", value: props.categoryId });
  }

  if (props.counterpartyId) {
    filters.push({ field: "counterpartyId", operator: "==", value: props.counterpartyId });
  }

  if (props.bankAccountId) {
    filters.push({ field: "bankAccountId", operator: "==", value: props.bankAccountId });
  }

  if (props.type) {
    filters.push({ field: "type", operator: "==", value: props.type });
  }

  return filters;
};

const paginateWithSearch = async (props: {
  filters: FirebaseFilterFor<ITransaction>[];
  search: string;
  pagination: IPaginationBody;
}): Promise<IPaginationResult<Item>> => {
  const allItems = await firebaseList<Item>({
    collection: "transactions",
    filters: props.filters,
  });

  const searchLower = props.search.toLowerCase();
  let filtered = allItems.filter((t) =>
    t.description?.toLowerCase().includes(searchLower)
  );

  const orderBy = props.pagination.orderBy ?? { field: "createdAt", direction: "desc" as const };
  filtered.sort((a, b) => {
    const fieldA = a[orderBy.field as keyof Item];
    const fieldB = b[orderBy.field as keyof Item];

    if (fieldA == null && fieldB == null) return 0;
    if (fieldA == null) return 1;
    if (fieldB == null) return -1;

    const comparison = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    return orderBy.direction === "asc" ? comparison : -comparison;
  });

  const count = filtered.length;
  const totalPages = Math.ceil(count / props.pagination.limit);
  const start = (props.pagination.page - 1) * props.pagination.limit;
  const list = filtered.slice(start, start + props.pagination.limit);

  return {
    count,
    pages: totalPages,
    list,
    currentPage: props.pagination.page,
  };
};

export const paginateTransactions = async ({
  userId,
  search,
  startDate,
  endDate,
  categoryId,
  counterpartyId,
  bankAccountId,
  type,
  pagination,
  options,
}: IAPIPaginateTransactions) => {
  const response = await handleAppRequest(
    async () => {
      const filters = buildFilters({
        userId,
        startDate,
        endDate,
        categoryId,
        counterpartyId,
        bankAccountId,
        type,
      });

      if (search) {
        return await paginateWithSearch({ filters, search, pagination });
      }

      return await firebasePaginatedList<Item>({
        collection: "transactions",
        filters,
        pagination,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Transações" }),
      ...options,
    },
  );
  return response;
};
