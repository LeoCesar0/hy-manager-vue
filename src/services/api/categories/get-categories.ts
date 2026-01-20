import type { ICategory } from "~/@schemas/models/category";
import type { AppResponse } from "~/@schemas/app";

type IProps = {
  userId: string;
};

export const getCategories = async ({
  userId,
}: IProps): Promise<AppResponse<ICategory[]>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelList<ICategory>({
    collection: "categories",
    where: [
      {
        field: "userId",
        operator: "==",
        value: userId,
      },
    ],
  });
};
