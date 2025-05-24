import type { FirebaseCollection } from "./collections";
import { getDataById } from "./getDataById";

type IFirebaseGet = {
  collection: FirebaseCollection;
  id: string;
};

export const firebaseGet = async <T>({
  collection: collectionName,
  id,
}: IFirebaseGet): Promise<T> => {
  const snapShot = await getDataById(collectionName, id);
  const data = snapShot.data() as T;

  if (!data) {
    throw new Error("Data not found");
  }

  return data;
};
