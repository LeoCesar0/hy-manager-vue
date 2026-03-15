import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

type IProps = {
  bankAccountId: string;
} & IAPIRequestCommon<boolean>;

export type IAPIDeleteBudget = IProps;

export const deleteBudget = async ({ bankAccountId, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      await firebaseDelete({
        collection: "budgets",
        id: bankAccountId,
      });
      return true;
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Orçamento" }),
      ...options,
    }
  );
  return response;
};
