import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

export type IAPIDeleteTransaction = {
  id: string;
} & IAPIRequestCommon<void>;

export const deleteTransaction = async ({ 
  id,
  options 
}: IAPIDeleteTransaction) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseDelete({
        collection: "transactions",
        id,
      });
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Transação" }),
      ...options,
    }
  );
  return response;
};

