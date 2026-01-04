import {
  getDocs,
  query,
  QuerySnapshot,
  where,
  type DocumentData,
} from "firebase/firestore";
import { createCollectionRef } from "./createCollectionRef";
import type { FirebaseFilterFor } from "./@type";
import type { FirebaseCollection } from "./collections";

type IFirebaseList<R> = {
  collection: FirebaseCollection;
  filters?: FirebaseFilterFor<R>[];
};
export const firebaseList = async <R>({
  collection: collectionName,
  filters = [],
}: IFirebaseList<R>): Promise<R[]> => {
  const ref = createCollectionRef({ collectionName });

  filters = filters.reduce((acc, entry) => {
    // --------------------------
    // Remove duplicates
    // --------------------------
    if (!acc.find((filter) => filter.field === entry.field)) {
      acc.push(entry);
    }
    return acc;
  }, [] as typeof filters);

  let whereList = filters.map(({ field, operator = "==", value }) =>
    where(field as string, operator, value)
  );

  let firebaseQuery = query(ref, ...whereList);

  const snapShot = await getDocs(firebaseQuery);
  const list: R[] = [];
  snapShot.forEach((doc) => {
    list.push(doc.data() as R);
  });
  return list;
};
