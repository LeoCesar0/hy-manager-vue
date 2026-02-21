import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

export type IAPIDeleteCategory = {
  id: string;
} & IAPIRequestCommon<boolean>;

export const deleteCategory = async ({ id, options }: IAPIDeleteCategory) => {
  const response = await handleAppRequest(
    async () => {
      await firebaseDelete({
        collection: "categories",
        id,
      });

      return true
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};

