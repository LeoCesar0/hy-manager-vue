import { v4 as uuid } from "uuid";
import { firebaseUpsertData } from "./firebaseUpsertData";
import { getDataById } from "./getDataById";
import type { AnyObject } from "~/@types/anyObject";
import { COLLECTION_SCHEMA, type FirebaseCollection } from "./collections";
import { Timestamp } from "firebase/firestore";
import type { ICommonDoc } from "~/@schemas/models/@common";

type IFirebaseCreate<T extends AnyObject> = {
  collection: FirebaseCollection;
  data: T;
};
export const firebaseCreate = async <T extends AnyObject, R = T>({
  collection: collectionName,
  data,
}: IFirebaseCreate<T>): Promise<R> => {
  const id = data.id || uuid();
  const schema = COLLECTION_SCHEMA[collectionName];
  const commonData: ICommonDoc = {
    id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const newData = schema.parse({
    ...data,
    ...commonData,
  });
  console.log(`❗ newData -->`, newData);
  await firebaseUpsertData(collectionName, newData, id);
  const snapShot = await getDataById(collectionName, id);
  const createdData = snapShot.data() as R;

  if (!createdData) {
    throw new Error("Error creating data");
  }

  return createdData;
};
