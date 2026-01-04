export type IPaginationBody = {
  page: number;
  limit: number;
  orderBy?: {
    field: string;
    direction: "asc" | "desc";
  };
};
export type IPaginationResult<T> = {
  count: number;
  pages: number;
  list: T[];
  currentPage: number;
};
