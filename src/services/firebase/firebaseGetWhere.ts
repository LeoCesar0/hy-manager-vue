import { getDocs, query, where } from "firebase/firestore";
import { createCollectionRef } from "./createCollectionRef";
import type { FirebaseFilterFor } from "./@type";
import type { FirebaseCollection } from "./collections";

type IFIrebaseGetWhere<T> = {
  collection: FirebaseCollection;
  filters: FirebaseFilterFor<T>[];
};
export const firebaseGetWhere = async <T>({
  collection: collectionName,
  filters,
}: IFIrebaseGetWhere<T>): Promise<T | undefined> => {
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

  const whereList = filters.map(({ field, operator = "==", value }) =>
    where(field as string, operator, value)
  );

  let snapShot;

  const firebaseQuery = query(ref, ...whereList);

  snapShot = await getDocs(firebaseQuery);
  const item: T | undefined = snapShot.docs[0]?.data() as T | undefined

  return item;
};
