import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IBudget, IBudgetBase } from "~/@schemas/models/budget";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";

type IProps = {
  bankAccountId: string;
  data: Partial<IBudgetBase>;
} & IAPIRequestCommon<IBudget>;

export type IAPIUpdateBudget = IProps;

export const updateBudget = async ({ bankAccountId, data, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate<IBudgetBase, IBudget>({
        collection: "budgets",
        id: bankAccountId,
        data,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Orçamento" }),
      ...options,
    }
  );
  return response;
};
