import { deleteDoc, WriteBatch } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { FirebaseCollection } from "./collections";

type IFirebaseBatchDelete = {
  collection: FirebaseCollection;
  id: string;
  batch: WriteBatch
};
export const firebaseBatchDelete = async ({
  collection: collectionName,
  id,
  batch,
}: IFirebaseBatchDelete) => {
  const docRef = createDocRef({
    collection: collectionName,
    id: id,
  });
  batch.delete(docRef);
};
