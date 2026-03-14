import { writeBatch, WriteBatch } from "firebase/firestore";
import type { FirebaseCollection } from "./collections";
import { firebaseBatchDelete } from "./firebaseBatchDelete";

type IFirebaseDeleteMany = {
  collection: FirebaseCollection;
  ids: string[];
  batch?: WriteBatch;
};

export const firebaseDeleteMany = async ({
  collection: collectionName,
  ids,
  batch: _batch,
}: IFirebaseDeleteMany) => {
  const { firebaseDB } = useFirebaseStore();
  const batch = _batch || writeBatch(firebaseDB);

  for (const id of ids) {
    await firebaseBatchDelete({
      collection: collectionName,
      id,
      batch,
    });
  }

  if (!_batch) await batch.commit();

  return true;
};
