import { FirebaseCollection } from "./collections";
import { getDataById } from "./getDataById";

type IFirebaseGet = {
  collection: FirebaseCollection;
  id: string;
};

export const firebaseGet = async <T>({
  collection: collectionName,
  id,
}: IFirebaseGet): Promise<T | undefined> => {
  const snapShot = await getDataById(collectionName, id);
  const data = snapShot.data() as T | undefined;

  return data;
};
