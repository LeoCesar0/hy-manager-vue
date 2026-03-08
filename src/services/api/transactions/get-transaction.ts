import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ITransaction;

export type IAPIGetTransaction = {
  id: string;
} & IAPIRequestCommon<Item>;

export const getTransaction = async ({ id, options }: IAPIGetTransaction) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet<Item>({
        collection: "transactions",
        id,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Transação" }),
      ...options,
    }
  );
  return response;
};
