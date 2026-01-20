import type {
  ICategory,
  ICreateCategory,
} from "~/@schemas/models/category";
import type { AppResponse } from "~/@schemas/app";

export const createCategory = async (
  data: ICreateCategory
): Promise<AppResponse<ICategory>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelCreate<ICreateCategory, ICategory>({
    collection: "categories",
    data,
  });
};
