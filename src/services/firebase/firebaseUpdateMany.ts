import { writeBatch, Timestamp, WriteBatch } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";
import type { AnyObject } from "~/@types/anyObject";
import { chunk } from "~/helpers/chunk";
import { BATCH_MAX } from "./@constants";

type UpdateItem<T extends AnyObject> = {
  id: string;
  data: Partial<T> &
    Partial<{ id: string; createdAt: Timestamp; updatedAt: Timestamp }>;
};

type IFirebaseUpdateMany<T extends AnyObject> = {
  collection: FirebaseCollection;
  items: UpdateItem<T>[];
  batch?: WriteBatch;
};

export const firebaseUpdateMany = async <T extends AnyObject, R = T>({
  collection: collectionName,
  items,
  batch: _batch,
}: IFirebaseUpdateMany<T>): Promise<{ id: string; data: R }[]> => {
  const { firebaseDB } = useFirebaseStore();

  if (!items || items.length === 0) {
    return [];
  }

  const schema = COLLECTION_SCHEMA[collectionName];

  const prepared = items.map(({ id, data }) => {
    const newData = schema.partial().parse({
      ...data,
      updatedAt: Timestamp.now(),
    });

    if (newData?.id) delete newData.id;
    if (newData?.createdAt) delete newData.createdAt;

    return { id, newData };
  });

  const updatedItems: { id: string; data: R }[] = prepared.map(({ id, newData }) => ({
    id,
    data: newData as R,
  }));

  if (_batch) {
    // External batch → caller owns the 500-op budget; do not chunk, do not commit.
    for (const { id, newData } of prepared) {
      const docRef = createDocRef({ collection: collectionName, id });
      _batch.update(docRef, newData);
    }
    return updatedItems;
  }

  for (const group of chunk({ items: prepared, size: BATCH_MAX })) {
    const batch = writeBatch(firebaseDB);
    for (const { id, newData } of group) {
      const docRef = createDocRef({ collection: collectionName, id });
      batch.update(docRef, newData);
    }
    await batch.commit();
  }

  return updatedItems;
};
