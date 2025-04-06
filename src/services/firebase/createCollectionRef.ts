import { collection, doc } from "firebase/firestore";
import { getServerPath } from "./getServerPath";
import { FirebaseCollection } from "./collections";
import { firebaseDB } from "./config";

export const createCollectionRef = ({
  collectionName,
}: {
  collectionName: FirebaseCollection;
}) => {
  const path = getServerPath();

  const ref = collection(firebaseDB, `env/${path}/${collectionName}`);

  return ref;
};
