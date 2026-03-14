import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";
import { cascadeDeleteBankAccount } from "../sync/cascade-delete-bank-account";

export type IAPIDeleteBankAccount = {
  id: string;
  userId: string;
} & IAPIRequestCommon<boolean>;

export const deleteBankAccount = async ({ id, userId, options }: IAPIDeleteBankAccount) => {
  const response = await handleAppRequest(
    async () => {
      await cascadeDeleteBankAccount({ bankAccountId: id, userId });

      await firebaseDelete({
        collection: "bankAccounts",
        id,
      });

      return true;
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Conta Bancária" }),
      ...options,
    }
  );
  return response;
};

