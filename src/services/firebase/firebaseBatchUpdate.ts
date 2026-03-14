import { Timestamp, WriteBatch } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";
import type { AnyObject } from "~/@types/anyObject";

type IProps<T extends AnyObject> = {
  collection: FirebaseCollection;
  id: string;
  data: Partial<T>;
  batch: WriteBatch;
};

export const firebaseBatchUpdate = <T extends AnyObject, R = T>({
  collection: collectionName,
  id,
  data,
  batch,
}: IProps<T>): { id: string; data: R } => {
  const schema = COLLECTION_SCHEMA[collectionName];

  const newData = schema.partial().parse({
    ...data,
    updatedAt: Timestamp.now(),
  });

  if (newData?.id) delete newData.id;
  if (newData?.createdAt) delete newData.createdAt;

  const docRef = createDocRef({
    collection: collectionName,
    id,
  });

  batch.update(docRef, newData);

  return { id, data: newData as R };
};
