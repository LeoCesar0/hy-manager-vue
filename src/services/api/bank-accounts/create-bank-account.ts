import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  IBankAccount,
  ICreateBankAccount,
} from "~/@schemas/models/bank-account";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = IBankAccount;

export type IAPICreateBankAccount = {
  data: ICreateBankAccount;
} & IAPIRequestCommon<Item>;

export const createBankAccount = async ({ data, options }: IAPICreateBankAccount) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate({
        collection: "bankAccounts",
        data,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Conta Bancária" }),
      ...options,
    }
  );
  return response;
};

