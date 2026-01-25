import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  IFile,
  ICreateFile,
} from "~/@schemas/models/file";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = IFile;

export type IAPICreateFile = {
  data: ICreateFile;
} & IAPIRequestCommon<Item>;

export const createFile = async ({ data, options }: IAPICreateFile) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate({
        collection: "files",
        data,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Arquivo" }),
      ...options,
    }
  );
  return response;
};
