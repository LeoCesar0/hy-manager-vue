import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

export type IAPIDeleteBankAccount = {
  id: string;
} & IAPIRequestCommon<void>;

export const deleteBankAccount = async ({ id, options }: IAPIDeleteBankAccount) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseDelete({
        collection: "bankAccounts",
        id,
      });
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Conta Bancária" }),
      ...options,
    }
  );
  return response;
};

