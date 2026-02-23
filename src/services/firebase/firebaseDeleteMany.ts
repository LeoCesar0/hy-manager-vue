import { writeBatch } from "firebase/firestore";
import type { FirebaseCollection } from "./collections";
import { firebaseDelete } from "./firebaseDelete";
import { firebaseBatchDelete } from "./firebaseBatchDelete";

type IFirebaseDelete = {
  collection: FirebaseCollection;
  ids: string[];
};
export const firebaseDeleteMany = async ({
  collection: collectionName,
  ids,
}: IFirebaseDelete) => {
  const { firebaseDB } = useFirebaseStore();
  const batch = writeBatch(firebaseDB);
  for (const id of ids) {
    await firebaseBatchDelete({
      collection: collectionName,
      id,
      batch,
    })
  }
  await batch.commit();
  return true
};
