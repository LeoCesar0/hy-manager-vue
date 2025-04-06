export type Pagination = {
  page: number;
  limit: number;
  orderBy?: {
    field: string;
    direction: "asc" | "desc";
  };
};
export type PaginationResult<T> = {
  count: number;
  pages: number;
  list: T[];
  currentPage: number;
};
