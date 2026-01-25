import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  IBankAccount,
  IUpdateBankAccount,
} from "~/@schemas/models/bank-account";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";

type Item = IBankAccount;

export type IAPIUpdateBankAccount = {
  id: string;
  data: IUpdateBankAccount;
} & IAPIRequestCommon<Item>;

export const updateBankAccount = async ({ id, data, options }: IAPIUpdateBankAccount) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate({
        collection: "bankAccounts",
        id,
        data,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Conta Bancária" }),
      ...options,
    }
  );
  return response;
};

