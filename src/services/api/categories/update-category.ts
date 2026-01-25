import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ICategory,
  IUpdateCategory,
} from "~/@schemas/models/category";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";

type Item = ICategory;

export type IAPIUpdateCategory = {
  id: string;
  data: IUpdateCategory;
} & IAPIRequestCommon<Item>;

export const updateCategory = async ({ id, data, options }: IAPIUpdateCategory) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate({
        collection: "categories",
        id,
        data,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};

