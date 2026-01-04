import { getDocs, query, where } from "firebase/firestore";
import { createCollectionRef } from "./createCollectionRef";
import type { FirebaseFilterFor } from "./@type";
import type { FirebaseCollection } from "./collections";

type IFIrebaseGetWhere<R> = {
  collection: FirebaseCollection;
  filters: FirebaseFilterFor<R>[];
};
export const firebaseGetWhere = async <R>({
  collection: collectionName,
  filters,
}: IFIrebaseGetWhere<R>): Promise<R | undefined> => {
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
  const item: R | undefined = snapShot.docs[0]?.data() as R | undefined

  return item;
};
