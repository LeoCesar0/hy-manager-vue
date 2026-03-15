import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = IBankAccount;

export type IAPIGetBankAccount = {
  id: string;
} & IAPIRequestCommon<Item | null>;

export const getBankAccount = async ({ id, options }: IAPIGetBankAccount) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet<Item>({
        collection: "bankAccounts",
        id,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Conta Bancária" }),
      ...options,
    },
  );
  return response;
};
