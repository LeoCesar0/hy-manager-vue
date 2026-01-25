import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ICategory } from "~/@schemas/models/category";
import type { IAPIRequestCommon } from "../@types";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICategory;

export type IAPIGetCategories = {
  userId: string;
} & IAPIRequestCommon<Item[]>;

export const getCategories = async ({ userId, options }: IAPIGetCategories) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseList<Item>({
        collection: "categories",
        filters: [
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
        ],
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Categorias" }),
      ...options,
    }
  );
  return response;
};

