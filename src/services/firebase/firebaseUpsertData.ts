import { setDoc } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import { FirebaseCollection } from "./collections";

export const firebaseUpsertData = (
  collectionName: FirebaseCollection,
  data: any,
  id: string
) => {
  const docRef = createDocRef({
    collection: collectionName,
    id: id,
  });
  return setDoc(docRef, data, { merge: true });
};
