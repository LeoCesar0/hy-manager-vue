import { Timestamp } from "firebase/firestore";
import { getDataById } from "./getDataById";
import { firebaseUpsertData } from "./firebaseUpsertData";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";
import { zUser } from "~/@schemas/models/user";
import type { AnyObject } from "~/@types/anyObject";

type IFirebaseUpdate<T extends AnyObject> = {
  collection: FirebaseCollection;
  data: Partial<T> &
    Partial<{ id: string; createdAt: Timestamp; updatedAt: Timestamp }>;
  id: string;
};
export const firebaseUpdate = async <T extends AnyObject, R = T>({
  collection: collectionName,
  data,
  id,
}: IFirebaseUpdate<T>): Promise<R> => {
  if(!id) {
    throw new Error("Id is required");
  }
  const schema = COLLECTION_SCHEMA[collectionName];
  const newData = schema.partial().parse({
    ...data,
    updatedAt: Timestamp.now(),
  });

  if (newData?.id) delete newData.id;
  if (newData?.createdAt) delete newData.createdAt;

  await firebaseUpsertData(collectionName, newData, id);
  const snapShot = await getDataById(collectionName, id);
  const updatedData = snapShot.data() as R;

  if (!updatedData) {
    throw new Error("Error updating data");
  }

  return updatedData;
};
