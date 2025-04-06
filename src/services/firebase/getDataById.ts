import { getDoc } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import { FirebaseCollection } from "./collections";

export const getDataById = (collectionName: FirebaseCollection, id: string) => {
  const docRef = createDocRef({
    collection: collectionName,
    id: id,
  });
  return getDoc(docRef);
};
