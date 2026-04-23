import { writeBatch, WriteBatch } from "firebase/firestore";
import type { FirebaseCollection } from "./collections";
import { firebaseBatchDelete } from "./firebaseBatchDelete";
import { chunk } from "~/helpers/chunk";
import { BATCH_MAX } from "./@constants";

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

  if (!ids || ids.length === 0) return true;

  if (_batch) {
    // External batch → caller owns the 500-op budget; do not chunk, do not commit.
    for (const id of ids) {
      await firebaseBatchDelete({ collection: collectionName, id, batch: _batch });
    }
    return true;
  }

  for (const group of chunk({ items: ids, size: BATCH_MAX })) {
    const batch = writeBatch(firebaseDB);
    for (const id of group) {
      await firebaseBatchDelete({ collection: collectionName, id, batch });
    }
    await batch.commit();
  }

  return true;
};
