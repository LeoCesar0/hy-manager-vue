import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IFile } from "~/@schemas/models/file";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = IFile;

export type IAPIListFiles = {
  fileIds: string[];
} & IAPIRequestCommon<Item[]>;

export const listFiles = async ({ fileIds, options }: IAPIListFiles) => {
  const response = await handleAppRequest(
    async () => {
      const filePromises = fileIds.map(async (fileId) => {
        return await firebaseGet<Item>({
          collection: "files",
          id: fileId,
        });
      });

      const files = await Promise.all(filePromises);
      return files.filter(Boolean) as Item[];
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Arquivos" }),
      ...options,
    }
  );
  return response;
};
