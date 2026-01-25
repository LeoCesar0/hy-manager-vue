import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { AppResponse } from "~/@schemas/app";

type IProps = {
  userId: string;
};

export const getCreditors = async ({
  userId,
}: IProps): Promise<AppResponse<ICounterparty[]>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelList<ICounterparty>({
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
