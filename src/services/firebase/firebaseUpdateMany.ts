import { writeBatch, Timestamp } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";
import type { AnyObject } from "~/@types/anyObject";

type UpdateItem<T extends AnyObject> = {
  id: string;
  data: Partial<T> &
    Partial<{ id: string; createdAt: Timestamp; updatedAt: Timestamp }>;
};

type IFirebaseUpdateMany<T extends AnyObject> = {
  collection: FirebaseCollection;
  items: UpdateItem<T>[];
};

export const firebaseUpdateMany = async <T extends AnyObject, R = T>({
  collection: collectionName,
  items,
}: IFirebaseUpdateMany<T>): Promise<{ id: string; data: R }[]> => {
  const { firebaseDB } = useFirebaseStore();

  if (!items || items.length === 0) {
    return [];
  }

  const batch = writeBatch(firebaseDB);
  const updatedItems: { id: string; data: R }[] = [];
  const schema = COLLECTION_SCHEMA[collectionName];

  for (const item of items) {
    const { id, data } = item;
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
    updatedItems.push({ id, data: newData as R });
  }

  await batch.commit();

  return updatedItems;
};
