import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IBudget } from "~/@schemas/models/budget";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";

type IProps = {
  bankAccountId: string;
} & IAPIRequestCommon<IBudget>;

export type IAPIGetBudget = IProps;

export const getBudget = async ({ bankAccountId, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet<IBudget>({
        collection: "budgets",
        id: bankAccountId,
      });
    },
    {
      toastOptions: undefined,
      ...options,
    }
  );
  return response;
};
