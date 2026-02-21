import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ICategory,
  ICreateCategory,
} from "~/@schemas/models/category";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = ICategory;

export type IAPICreateCategory = {
  data: ICreateCategory;
} & IAPIRequestCommon<Item>;

export const createCategory = async ({ data, options }: IAPICreateCategory) => {
  const response = await handleAppRequest(
    async () => {
      const result = await firebaseCreate<ICreateCategory, ICategory>({
        collection: "categories",
        data,
      });
      return result
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};

