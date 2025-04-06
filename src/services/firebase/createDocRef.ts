import { doc } from "firebase/firestore";
import { getServerPath } from "./getServerPath";
import { firebaseDB } from "./config";
import type { FirebaseCollection } from "./collections";

export const createDocRef = ({
  collection,
  id,
}: {
  collection: FirebaseCollection;
  id: string;
}) => {
  const path = getServerPath();

  const ref = doc(firebaseDB, `env/${path}/${collection}/${id}`);

  return ref;
};
