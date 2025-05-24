import { Timestamp } from "firebase/firestore";
import { getDataById } from "./getDataById";
import { firebaseUpsertData } from "./firebaseUpsertData";
import type { FirebaseCollection } from "./collections";

type IFirebaseUpdate<T> = {
  collection: FirebaseCollection;
  data: Partial<T> &
    Partial<{ id: string; createdAt: Timestamp; updatedAt: Timestamp }>;
  id: string;
};
export const firebaseUpdate = async <T>({
  collection: collectionName,
  data,
  id,
}: IFirebaseUpdate<T>) => {
  const newData = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (newData?.id) delete newData.id;
  if (newData?.createdAt) delete newData.createdAt;

  await firebaseUpsertData(collectionName, newData, id);
  const snapShot = await getDataById(collectionName, id);
  const updatedData = snapShot.data() as T | undefined;
  return updatedData;
};
