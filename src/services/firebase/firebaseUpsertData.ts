import { setDoc } from "firebase/firestore";
import { createDocRef } from "./createDocRef";
import type { FirebaseCollection } from "./collections";

export const firebaseUpsertData = async (
  collectionName: FirebaseCollection,
  data: any,
  id: string
) => {
  try {
    const docRef = createDocRef({
      collection: collectionName,
      id: id,
    });
    return await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.log(`❌ Error upserting data -->`, err);
    throw err;
  }
};
