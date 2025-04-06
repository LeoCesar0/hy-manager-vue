import { doc } from "firebase/firestore";
import { getServerPath } from "./getServerPath";
import { FirebaseCollection } from "~/services/firebase/collections";
import { firebaseDB } from "./config";

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
