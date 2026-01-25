import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

export type IAPIDeleteCategory = {
  id: string;
} & IAPIRequestCommon<void>;

export const deleteCategory = async ({ id, options }: IAPIDeleteCategory) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseDelete({
        collection: "categories",
        id,
      });
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};

