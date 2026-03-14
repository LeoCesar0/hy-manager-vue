import { deleteDoc, WriteBatch } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { FirebaseCollection } from "./collections";

type IFirebaseDelete = {
  collection: FirebaseCollection;
  id: string;
  batch?: WriteBatch;
};

export const firebaseDelete = async ({
  collection: collectionName,
  id,
  batch,
}: IFirebaseDelete) => {
  const docRef = createDocRef({
    collection: collectionName,
    id,
  });

  if (batch) {
    batch.delete(docRef);
  } else {
    await deleteDoc(docRef);
  }

  return true;
};
