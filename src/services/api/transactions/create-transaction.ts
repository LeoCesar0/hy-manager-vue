import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ITransaction,
  ICreateTransaction,
} from "~/@schemas/models/transaction";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";
import { getOrCreateCreditor } from "../creditors/get-or-create-creditor";

type Item = ITransaction;

export type IAPICreateTransaction = {
  data: ICreateTransaction;
  creditorName?: string;
} & IAPIRequestCommon<Item>;

export const createTransaction = async ({ 
  data, 
  creditorName,
  options 
}: IAPICreateTransaction) => {
  const response = await handleAppRequest(
    async () => {
      let counterpartyId = data.counterpartyId;

      if (creditorName && !counterpartyId) {
        const categoryIds = data.categoryIds || [];
        const creditorResult = await getOrCreateCreditor({
          name: creditorName,
          userId: data.userId,
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

      return firebaseCreate({
        collection: "transactions",
        data: transactionData,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Transação" }),
      ...options,
    }
  );
  return response;
};

