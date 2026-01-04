import { deleteDoc } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { FirebaseCollection } from "./collections";

type IFirebaseDelete = {
  collection: FirebaseCollection;
  id: string;
};
export const firebaseDelete = async ({
  collection: collectionName,
  id,
}: IFirebaseDelete): Promise<void> => {
  const docRef = createDocRef({
    collection: collectionName,
    id: id,
  });
  await deleteDoc(docRef);
};
