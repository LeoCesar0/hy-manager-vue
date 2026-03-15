import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ICategory } from "~/@schemas/models/category";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICategory;

export type IAPIGetCategory = {
  id: string;
} & IAPIRequestCommon<Item | null>;

export const getCategory = async ({ id, options }: IAPIGetCategory) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet<Item>({
        collection: "categories",
        id,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Categoria" }),
      ...options,
    },
  );
  return response;
};
