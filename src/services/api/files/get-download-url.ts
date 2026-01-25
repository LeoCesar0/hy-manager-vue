import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";

export type IAPIGetDownloadUrl = {
  path: string;
} & IAPIRequestCommon<string>;

const getFirebaseStorage = () => {
  const firebaseStore = useFirebaseStore();
  return firebaseStore.firebaseStorage;
};

export const getDownloadUrl = async ({ path, options }: IAPIGetDownloadUrl) => {
  const response = await handleAppRequest(
    async () => {
      const storage = getFirebaseStorage();
      const fileRef = storageRef(storage, path);
      const url = await getDownloadURL(fileRef);
      return url;
    },
    {
      toastOptions: undefined,
      ...options,
    }
  );
  return response;
};
