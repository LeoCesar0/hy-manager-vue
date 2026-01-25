import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ITransaction,
  IUpdateTransaction,
} from "~/@schemas/models/transaction";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";
import { getOrCreateCreditor } from "../creditors/get-or-create-creditor";

type Item = ITransaction;

export type IAPIUpdateTransaction = {
  id: string;
  data: IUpdateTransaction;
  creditorName?: string;
} & IAPIRequestCommon<Item>;

export const updateTransaction = async ({ 
  id,
  data, 
  creditorName,
  options 
}: IAPIUpdateTransaction) => {
  const response = await handleAppRequest(
    async () => {
      let counterpartyId = data.counterpartyId;

      if (creditorName && !counterpartyId) {
        const categoryIds = data.categoryIds || [];
        const creditorResult = await getOrCreateCreditor({
          name: creditorName,
          userId: data.userId!,
          categoryIds: categoryIds.filter((id) => id),
        });

        if (creditorResult.data) {
          counterpartyId = creditorResult.data.id;
        }
      }

      const transactionData = {
        ...data,
        counterpartyId: counterpartyId || null,
      };

      return firebaseUpdate({
        collection: "transactions",
        id,
        data: transactionData,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Transação" }),
      ...options,
    }
  );
  return response;
};

