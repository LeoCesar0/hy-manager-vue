import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";
import { cascadeDeleteCategory } from "../sync/cascade-delete-category";

export type IAPIDeleteCategory = {
  id: string;
  userId: string;
} & IAPIRequestCommon<boolean>;

export const deleteCategory = async ({ id, userId, options }: IAPIDeleteCategory) => {
  const response = await handleAppRequest(
    async () => {
      await cascadeDeleteCategory({ categoryId: id, userId });

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

