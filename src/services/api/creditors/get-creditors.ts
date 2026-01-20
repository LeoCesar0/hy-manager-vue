import type { ICreditor } from "~/@schemas/models/creditor";
import type { AppResponse } from "~/@schemas/app";

type IProps = {
  userId: string;
};

export const getCreditors = async ({
  userId,
}: IProps): Promise<AppResponse<ICreditor[]>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelList<ICreditor>({
    collection: "creditors",
    filters: [
      {
        field: "userId",
        operator: "==",
        value: userId,
      },
    ],
  });
};
