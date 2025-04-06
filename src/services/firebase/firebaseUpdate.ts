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
  const now = new Date();

  if (data?.id) delete data.id;
  if (data?.createdAt) delete data.createdAt;
  data.updatedAt = Timestamp.fromDate(now);

  await firebaseUpsertData(collectionName, data, id);
  const snapShot = await getDataById(collectionName, id);
  const updatedData = snapShot.data() as T | undefined;
  return updatedData;
};
