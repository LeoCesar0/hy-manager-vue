import {
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  writeBatch,
  documentId,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type DocumentData,
  type WriteBatch,
} from "firebase/firestore";
import { createCollectionRef } from "./createCollectionRef";
import { BATCH_MAX } from "./@constants";
import type { FirebaseFilterFor } from "./@type";
import type { FirebaseCollection } from "./collections";

type IOnPageArgs<R> = {
  items: R[];
  batch: WriteBatch;
};

type IProps<R> = {
  collection: FirebaseCollection;
  filters?: FirebaseFilterFor<R>[];
  pageSize?: number;
  onPage: (args: IOnPageArgs<R>) => void | Promise<void>;
};

export const cascadePaginatedBatch = async <R>({
  collection: collectionName,
  filters = [],
  pageSize = BATCH_MAX,
  onPage,
}: IProps<R>): Promise<void> => {
  const { firebaseDB } = useFirebaseStore();
  const ref = createCollectionRef({ collectionName });

  const whereList = filters.map(({ field, operator = "==", value }) =>
    where(field as string, operator, value)
  );

  let cursor: QueryDocumentSnapshot<DocumentData> | null = null;

  while (true) {
    const baseQuery: Query<DocumentData> = cursor
      ? query(
          ref,
          ...whereList,
          orderBy(documentId()),
          startAfter(cursor),
          limit(pageSize)
        )
      : query(ref, ...whereList, orderBy(documentId()), limit(pageSize));

    const snapshot: QuerySnapshot<DocumentData> = await getDocs(baseQuery);

    if (snapshot.empty) break;

    const items: R[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as R);
    const batch = writeBatch(firebaseDB);

    await onPage({ items, batch });
    await batch.commit();

    if (snapshot.docs.length < pageSize) break;

    cursor = snapshot.docs[snapshot.docs.length - 1] ?? null;
  }
};
