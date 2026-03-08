import {
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import { createCollectionRef } from "./createCollectionRef";
import type { FirebaseFilterFor } from "./@type";
import type { FirebaseCollection } from "./collections";

type IProps<R> = {
  collection: FirebaseCollection;
  filters?: FirebaseFilterFor<R>[];
  pagination: IPaginationBody;
};
export const firebasePaginatedList = async <R>({
  collection: collectionName,
  filters = [],
  pagination,
}: IProps<R>): Promise<IPaginationResult<R>> => {
  const ref = createCollectionRef({ collectionName });
  const whereList = filters.map(({ field, operator = "==", value }) =>
    where(field as string, operator, value)
  );

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

  const baseQuery = query(ref, ...whereList, ...orderByParams);

  const [countSnapshot, dataSnapshot] = await Promise.all([
    getCountFromServer(baseQuery),
    getDocs(query(baseQuery, limit(pagination.page * pagination.limit))),
  ]);

  const count = countSnapshot.data().count;
  const totalPages = Math.ceil(count / pagination.limit);

  const docsToSkip = (pagination.page - 1) * pagination.limit;
  const list: R[] = dataSnapshot.docs
    .slice(docsToSkip)
    .map((doc) => doc.data() as R);

  return {
    count,
    pages: totalPages,
    list,
    currentPage: pagination.page,
  };
};
