import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { Timestamp, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import type { IPaginationBody } from "~/@types/pagination";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCursorList } from "~/services/firebase/firebaseCursorList";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultSearchWindow } from "~/helpers/get-default-search-window";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ITransaction;

/**
 * Cursor-based result (Next/Previous only) for the transactions list. `cursor`
 * is the last document of the page, passed back as `cursor` to load the next
 * page. In search mode `cursor` is always null (search paginates client-side
 * over a date-bounded subset).
 */
export type ICursorPaginationResult<T> = {
  list: T[];
  count: number;
  hasNext: boolean;
  cursor: QueryDocumentSnapshot<DocumentData> | null;
};

export type IAPIPaginateTransactions = {
  userId: string;
  search?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryIds?: string[];
  counterpartyId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
  pagination: IPaginationBody;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
} & IAPIRequestCommon<ICursorPaginationResult<Item>>;

const buildFilters = (props: {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryIds?: string[];
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

  if (props.categoryIds?.length === 1) {
    filters.push({ field: "categoryIds", operator: "array-contains", value: props.categoryIds[0] });
  } else if (props.categoryIds && props.categoryIds.length > 1) {
    filters.push({ field: "categoryIds", operator: "array-contains-any", value: props.categoryIds });
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

/**
 * Firestore has no full-text search, so text search fetches the matching docs
 * and filters by substring on the client. To keep that fetch bounded, search
 * without an explicit date range is capped to the last 6 months. Pagination of
 * the (small) result set is offset-based and runs entirely in memory.
 */
const paginateWithSearch = async (props: {
  filters: FirebaseFilterFor<ITransaction>[];
  search: string;
  pagination: IPaginationBody;
}): Promise<ICursorPaginationResult<Item>> => {
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
  const start = (props.pagination.page - 1) * props.pagination.limit;
  const list = filtered.slice(start, start + props.pagination.limit);

  return {
    list,
    count,
    hasNext: props.pagination.page * props.pagination.limit < count,
    cursor: null,
  };
};

export const paginateTransactions = async ({
  userId,
  search,
  startDate,
  endDate,
  categoryIds,
  counterpartyId,
  bankAccountId,
  type,
  pagination,
  cursor,
  options,
}: IAPIPaginateTransactions) => {
  const response = await handleAppRequest(
    async () => {
      if (search) {
        // Bound an undated search to the last 6 months so it doesn't fetch the
        // whole history; an explicit range from the user is respected as-is.
        const window = !startDate && !endDate ? getDefaultSearchWindow() : null;
        const filters = buildFilters({
          userId,
          startDate: startDate ?? window?.startDate,
          endDate: endDate ?? window?.endDate,
          categoryIds,
          counterpartyId,
          bankAccountId,
          type,
        });

        return await paginateWithSearch({ filters, search, pagination });
      }

      const filters = buildFilters({
        userId,
        startDate,
        endDate,
        categoryIds,
        counterpartyId,
        bankAccountId,
        type,
      });

      const result = await firebaseCursorList<Item>({
        collection: "transactions",
        filters,
        limit: pagination.limit,
        orderBy: pagination.orderBy,
        startAfterDoc: cursor,
        withCount: true,
      });

      return {
        list: result.list,
        count: result.count ?? 0,
        hasNext: result.hasNext,
        cursor: result.lastDoc,
      };
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Transações" }),
      ...options,
    },
  );
  return response;
};
