import { v4 as uuid } from "uuid";
import { writeBatch, Timestamp } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { AnyObject } from "~/@types/anyObject";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";

type IFirebaseCreateMany<T extends AnyObject> = {
  collection: FirebaseCollection;
  data: T[];
};

export const firebaseCreateMany = async <T extends AnyObject, R = T>({
  collection: collectionName,
  data,
}: IFirebaseCreateMany<T>): Promise<R[]> => {
  const { firebaseDB } = useFirebaseStore();

  if (!data || data.length === 0) {
    return [];
  }

  const batch = writeBatch(firebaseDB);
  const documentsData: R[] = [];

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
    documentsData.push(newData as unknown as R);
  }

  await batch.commit();

  return documentsData;
};
