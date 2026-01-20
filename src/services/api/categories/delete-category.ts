import type { AppResponse } from "~/@schemas/app";

export const deleteCategory = async (
  id: string
): Promise<AppResponse<void>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelDelete({
    collection: "categories",
    id,
  });
};
