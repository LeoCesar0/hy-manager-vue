import type { FirebaseCollection } from "./collections";
import { getDataById } from "./getDataById";

type IFirebaseGet = {
  collection: FirebaseCollection;
  id: string;
};

export const firebaseGet = async <R>({
  collection: collectionName,
  id,
}: IFirebaseGet): Promise<R> => {
  const snapShot = await getDataById(collectionName, id);
  const data = snapShot.data() as R;

  if (!data) {
    throw new Error("Data not found");
  }

  return data;
};
