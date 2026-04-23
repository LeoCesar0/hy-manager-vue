import { v4 as uuid } from "uuid";
import { writeBatch, Timestamp, WriteBatch } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { AnyObject } from "~/@types/anyObject";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";
import { chunk } from "~/helpers/chunk";
import { BATCH_MAX } from "./@constants";

type IFirebaseCreateMany<T extends AnyObject> = {
  collection: FirebaseCollection;
  data: T[];
  batch?: WriteBatch;
};

export const firebaseCreateMany = async <T extends AnyObject, R = T>({
  collection: collectionName,
  data,
  batch: _batch
}: IFirebaseCreateMany<T>): Promise<R[]> => {
  const { firebaseDB } = useFirebaseStore();

  if (!data || data.length === 0) {
    return [];
  }

  const schema = COLLECTION_SCHEMA[collectionName];

  const prepared = data.map((item) => {
    const id = item.id || uuid();
    const newData = schema.parse({
      ...item,
      id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id, newData };
  });

  const documentsData: R[] = prepared.map(({ newData }) => newData as unknown as R);

  if (_batch) {
    // External batch → caller owns the 500-op budget; do not chunk, do not commit.
    for (const { id, newData } of prepared) {
      const docRef = createDocRef({ collection: collectionName, id });
      _batch.set(docRef, newData);
    }
    return documentsData;
  }

  for (const group of chunk({ items: prepared, size: BATCH_MAX })) {
    const batch = writeBatch(firebaseDB);
    for (const { id, newData } of group) {
      const docRef = createDocRef({ collection: collectionName, id });
      batch.set(docRef, newData);
    }
    await batch.commit();
  }

  return documentsData;
};
