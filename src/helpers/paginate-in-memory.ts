import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";

type IProps<T> = {
  items: T[];
  searchField: keyof T;
  search?: string;
  // Intersection filter against an item's `categoryIds: string[]` field
  // (only meaningful for collections that carry one, e.g. counterparties).
  categoryIds?: string[];
  pagination: IPaginationBody;
};

/**
 * Client-side filter + sort + slice over an already-loaded list, returning the
 * same `IPaginationResult` shape the server paginator produces so `Pagination.vue`
 * consumes it unchanged. Used for reference data already cached in
 * `useReferenceDataStore` (counterparties, categories) to avoid re-fetching from
 * Firebase on every search/page change.
 */
export const paginateInMemory = <T>({
  items,
  searchField,
  search,
  categoryIds,
  pagination,
}: IProps<T>): IPaginationResult<T> => {
  let filtered = items;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((item) => {
      const value = item[searchField];
      return typeof value === "string" && value.toLowerCase().includes(searchLower);
    });
  }

  if (categoryIds && categoryIds.length > 0) {
    filtered = filtered.filter((item) => {
      const itemCategoryIds = (item as { categoryIds?: string[] }).categoryIds ?? [];
      return categoryIds.some((id) => itemCategoryIds.includes(id));
    });
  }

  const orderBy = pagination.orderBy ?? { field: "createdAt", direction: "desc" as const };
  filtered = [...filtered].sort((a, b) => {
    const fieldA = a[orderBy.field as keyof T];
    const fieldB = b[orderBy.field as keyof T];

    if (fieldA == null && fieldB == null) return 0;
    if (fieldA == null) return 1;
    if (fieldB == null) return -1;

    const comparison = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    return orderBy.direction === "asc" ? comparison : -comparison;
  });

  const count = filtered.length;
  const pages = Math.ceil(count / pagination.limit);
  const start = (pagination.page - 1) * pagination.limit;
  const list = filtered.slice(start, start + pagination.limit);

  return {
    count,
    pages,
    list,
    currentPage: pagination.page,
  };
};
