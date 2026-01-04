import { v4 as uuid } from "uuid";
import { writeBatch, Timestamp } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { AnyObject } from "~/@types/anyObject";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";

type IFirebaseCreateMany = {
  collection: FirebaseCollection;
  data: AnyObject[];
};

export const firebaseCreateMany = async <T extends { id: string }>({
  collection: collectionName,
  data,
}: IFirebaseCreateMany): Promise<T[]> => {
  const { firebaseDB } = useFirebaseStore();

  if (!data || data.length === 0) {
    return [];
  }

  const batch = writeBatch(firebaseDB);
  const documentsData: T[] = [];

  const schema = COLLECTION_SCHEMA[collectionName];

  for (const item of data) {
    const id = item.id || uuid();
    const newData = schema.parse({
      ...item,
      id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const docRef = createDocRef({
      collection: collectionName,
      id,
    });

    batch.set(docRef, newData);
    documentsData.push(newData as unknown as T);
  }

  await batch.commit();

  return documentsData;
};
