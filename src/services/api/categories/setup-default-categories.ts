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
import { getCategories } from "./get-categories";
import { DEFAULT_CATEGORIES } from "~/static/default-categories";
import { firebaseCreateMany } from "~/services/firebase/firebaseCreateMany";
import { slugify } from "~/helpers/slugify";
import { firebaseDeleteMany } from "~/services/firebase/firebaseDeleteMany";

export type IAPISetupDefaultCategories = {
  userId: string;
  deleteExisting?: boolean;
} & IAPIRequestCommon<ICategory[]>;

export const setupDefaultCategories = async ({ userId, deleteExisting, options }: IAPISetupDefaultCategories) => {
  const response = await handleAppRequest<ICategory[]>(
    async () => {
      const mappedIds = new Map<string, string>()
      let existingCategories = await getCategories({ userId })
      existingCategories.data?.forEach(c => mappedIds.set(slugify(c.name), c.id))
      if (deleteExisting) {
        await firebaseDeleteMany({
          collection: "categories",
          ids: existingCategories.data?.map(c => c.id) || [],
        })
        existingCategories = await getCategories({ userId }) // refetch to get the latest data
      }
      const defaultCategories = DEFAULT_CATEGORIES.filter(category => !existingCategories.data?.some(c => slugify(c.name) === slugify(category.name)));

      const values: ICreateCategory[] = defaultCategories.map(item => {
        return {
          ...item,
          userId,
          id: mappedIds.get(slugify(item.name)) || undefined,
        }
      })

      const result = await firebaseCreateMany<ICreateCategory, ICategory>({
        collection: "categories",
        data: values,
      })
      return result
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Categoria" }),
      ...options,
    }
  );
  return response;
};

