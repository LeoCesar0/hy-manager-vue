import { writeBatch, Timestamp } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";

type UpdateItem<T> = {
  id: string;
  data: Partial<T> &
    Partial<{ id: string; createdAt: Timestamp; updatedAt: Timestamp }>;
};

type IFirebaseUpdateMany<T> = {
  collection: FirebaseCollection;
  items: UpdateItem<T>[];
};

export const firebaseUpdateMany = async <T extends { id: string }>({
  collection: collectionName,
  items,
}: IFirebaseUpdateMany<T>): Promise<{ id: string; data: any }[]> => {
  const { firebaseDB } = useFirebaseStore();

  if (!items || items.length === 0) {
    return [];
  }

  const batch = writeBatch(firebaseDB);
  const updatedItems: { id: string; data: any }[] = [];
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
    updatedItems.push({ id, data: newData });
  }

  await batch.commit();

  return updatedItems;
};
