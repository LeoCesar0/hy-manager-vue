import {
  getDocs,
  query,
  where,
  orderBy,
  Query,
  type DocumentData,
} from "firebase/firestore";
import type { Pagination, PaginationResult } from "~/@types/pagination";
import { createCollectionRef } from "./createCollectionRef";
import { FirebaseCollection } from "./collections";
import type { FirebaseFilterFor } from "./@type";

type IProps<T> = {
  collection: FirebaseCollection;
  filters?: FirebaseFilterFor<T>[];
  pagination: Pagination;
};
export const firebasePaginatedList = async <T>({
  collection: collectionName,
  filters = [],
  pagination,
}: IProps<T>): Promise<PaginationResult<T>> => {
  const ref = createCollectionRef({ collectionName });
  let whereList = filters.map(({ field, operator = "==", value }) =>
    where(field as string, operator, value)
  );

  let snapShot;

  let firebaseQuery: Query<DocumentData>;

  const orderByValues = pagination.orderBy ?? {
    field: "createdAt",
    direction: "desc",
  };

  const orderByParams = [orderBy(orderByValues.field, orderByValues.direction)];

  const differentFilter = filters.find((filter) => filter.operator != "==");

  if (differentFilter) {
    orderByParams.unshift(
      orderBy(differentFilter.field as string, orderByValues.direction)
    );
  }

  firebaseQuery = query(
    ref,
    ...whereList,
    ...orderByParams
    // orderBy(orderByValues.field, orderByValues.direction)
  );

  snapShot = await getDocs(firebaseQuery);
  let list: T[] = snapShot.docs.map((doc) => doc.data() as T);

  const count = list.length;
  const totalPages = Math.ceil(count / pagination.limit);

  list = list.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return {
    count: count,
    pages: totalPages,
    list: list,
    currentPage: pagination.page,
  };
};
