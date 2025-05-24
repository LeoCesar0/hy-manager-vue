import { v4 as uuid } from "uuid";
import { firebaseUpsertData } from "./firebaseUpsertData";
import { getDataById } from "./getDataById";
import type { AnyObject } from "~/@types/anyObject";
import type { FirebaseCollection } from "./collections";
import { Timestamp } from "firebase/firestore";

type IFirebaseCreate = {
  collection: FirebaseCollection;
  data: AnyObject;
};
export const firebaseCreate = async <T extends { id: string }>({
  collection: collectionName,
  data,
}: IFirebaseCreate): Promise<T> => {
  const id = data.id || uuid();
  const newData = {
    ...data,
    id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await firebaseUpsertData(collectionName, newData, id);
  const snapShot = await getDataById(collectionName, id);
  const createdData = snapShot.data() as T;

  if (!createdData) {
    throw new Error("Error creating data");
  }

  return createdData;
};
