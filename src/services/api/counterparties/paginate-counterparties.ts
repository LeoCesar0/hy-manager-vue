import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import type { IAPIRequestCommon } from "../@types";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICounterparty;

export type IAPIPaginateCounterparties = {
  userId: string;
  search?: string;
  categoryIds?: string[];
  pagination: IPaginationBody;
} & IAPIRequestCommon<IPaginationResult<Item>>;

const buildFilters = (props: {
  userId: string;
  categoryIds?: string[];
}): FirebaseFilterFor<ICounterparty>[] => {
  const filters: FirebaseFilterFor<ICounterparty>[] = [
    { field: "userId", operator: "==", value: props.userId },
  ];

  if (props.categoryIds?.length === 1) {
    filters.push({ field: "categoryIds", operator: "array-contains", value: props.categoryIds[0] });
  } else if (props.categoryIds && props.categoryIds.length > 1) {
    filters.push({ field: "categoryIds", operator: "array-contains-any", value: props.categoryIds });
  }

  return filters;
};

const paginateWithSearch = async (props: {
  filters: FirebaseFilterFor<ICounterparty>[];
  search: string;
  pagination: IPaginationBody;
}): Promise<IPaginationResult<Item>> => {
  const allItems = await firebaseList<Item>({
    collection: "creditors",
    filters: props.filters,
  });

  const searchLower = props.search.toLowerCase();
  let filtered = allItems.filter((c) =>
    c.name.toLowerCase().includes(searchLower)
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

export const paginateCounterparties = async ({
  userId,
  search,
  categoryIds,
  pagination,
  options,
}: IAPIPaginateCounterparties) => {
  const response = await handleAppRequest(
    async () => {
      const filters = buildFilters({ userId, categoryIds });

      if (search) {
        return await paginateWithSearch({ filters, search, pagination });
      }

      return await firebasePaginatedList<Item>({
        collection: "creditors",
        filters,
        pagination,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Terceiros" }),
      ...options,
    },
  );
  return response;
};
