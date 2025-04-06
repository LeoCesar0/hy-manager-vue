import { collection, doc } from "firebase/firestore";
import { getServerPath } from "./getServerPath";
import { firebaseDB } from "./config";
import type { FirebaseCollection } from "./collections";

export const createCollectionRef = ({
  collectionName,
}: {
  collectionName: FirebaseCollection;
}) => {
  const path = getServerPath();

  const ref = collection(firebaseDB, `env/${path}/${collectionName}`);

  return ref;
};
