import { getDocs, query, where } from "firebase/firestore";
import { FirebaseCollection } from "./collections";
import { createCollectionRef } from "./createCollectionRef";
import type { FirebaseFilterFor } from "./@type";

type IFirebaseList<T> = {
  collection: FirebaseCollection;
  filters?: FirebaseFilterFor<T>[];
};
export const firebaseList = async <T>({
  collection: collectionName,
  filters = [],
}: IFirebaseList<T>): Promise<T[]> => {
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

  let snapShot;

  let firebaseQuery = query(ref, ...whereList);

  snapShot = await getDocs(firebaseQuery);
  const list: T[] = [];
  snapShot.forEach((doc) => {
    list.push(doc.data() as T);
  });
  return list;
};
