import type {
  ICategory,
  IUpdateCategory,
} from "~/@schemas/models/category";
import type { AppResponse } from "~/@schemas/app";

export const updateCategory = async (
  id: string,
  data: IUpdateCategory
): Promise<AppResponse<ICategory>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelUpdate<IUpdateCategory, ICategory>({
    collection: "categories",
    id,
    data,
  });
};
