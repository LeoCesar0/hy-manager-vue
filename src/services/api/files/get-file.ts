import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IFile } from "~/@schemas/models/file";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = IFile;

export type IAPIGetFile = {
  fileId: string;
} & IAPIRequestCommon<Item>;

export const getFile = async ({ fileId, options }: IAPIGetFile) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet({
        collection: "files",
        id: fileId,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Arquivo" }),
      ...options,
    }
  );
  return response;
};
