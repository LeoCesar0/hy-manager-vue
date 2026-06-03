import {
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { IPaginationBody } from "~/@types/pagination";
import { createCollectionRef } from "./createCollectionRef";
import type { FirebaseFilterFor } from "./@type";
import type { FirebaseCollection } from "./collections";

export type ICursorListResult<R> = {
  list: R[];
  hasNext: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  count?: number;
};

type IProps<R> = {
  collection: FirebaseCollection;
  filters?: FirebaseFilterFor<R>[];
  limit: number;
  orderBy?: IPaginationBody["orderBy"];
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  withCount?: boolean;
};

/**
 * Cursor-based pagination (Next/Previous only). Fetches `limit + 1` docs to
 * detect whether a further page exists without a second query, and returns the
 * last document of the page so the caller can pass it back as `startAfterDoc`.
 *
 * The `__name__` (document id) tiebreaker is implicit in Firestore composite
 * indexes, so `startAfter(docSnapshot)` is stable on the existing indexes
 * without an explicit `orderBy(documentId())`.
 */
export const firebaseCursorList = async <R>({
  collection: collectionName,
  filters = [],
  limit: pageLimit,
  orderBy: orderByInput,
  startAfterDoc,
  withCount = false,
}: IProps<R>): Promise<ICursorListResult<R>> => {
  const ref = createCollectionRef({ collectionName });
  const whereList = filters.map(({ field, operator = "==", value }) =>
    where(field as string, operator, value)
  );

  const orderByValues = orderByInput ?? {
    field: "createdAt",
    direction: "desc" as const,
  };

  const orderByParams = [orderBy(orderByValues.field, orderByValues.direction)];

  // Firestore requires an inequality-filtered field to be ordered first.
  const differentFilter = filters.find((filter) => filter.operator != "==");
  if (differentFilter && differentFilter.field !== orderByValues.field) {
    orderByParams.unshift(
      orderBy(differentFilter.field as string, orderByValues.direction)
    );
  }

  const constraints: QueryConstraint[] = [...whereList, ...orderByParams];
  if (startAfterDoc) {
    constraints.push(startAfter(startAfterDoc));
  }

  const baseQuery = query(ref, ...whereList, ...orderByParams);
  const pageQuery = query(ref, ...constraints, limit(pageLimit + 1));

  const [dataSnapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    withCount ? getCountFromServer(baseQuery) : Promise.resolve(null),
  ]);

  const docs = dataSnapshot.docs;
  const hasNext = docs.length > pageLimit;
  const pageDocs = hasNext ? docs.slice(0, pageLimit) : docs;

  const list = pageDocs.map((doc) => doc.data() as R);
  const lastDoc = pageDocs[pageDocs.length - 1] ?? null;

  return {
    list,
    hasNext,
    lastDoc,
    count: countSnapshot ? countSnapshot.data().count : undefined,
  };
};
