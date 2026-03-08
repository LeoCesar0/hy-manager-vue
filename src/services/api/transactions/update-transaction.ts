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
import { getOrCreateCounterparty } from "../counterparties/get-or-create-counterparty";

type Item = ITransaction;

export type IAPIUpdateTransaction = {
  id: string;
  data: IUpdateTransaction;
  counterpartyName?: string;
} & IAPIRequestCommon<Item>;

export const updateTransaction = async ({
  id,
  data,
  counterpartyName,
  options
}: IAPIUpdateTransaction) => {
  const response = await handleAppRequest(
    async () => {
      let counterpartyId = data.counterpartyId;
      let categoryIds = data.categoryIds || [];

      if (counterpartyName && !counterpartyId) {
        const counterpartyResult = await getOrCreateCounterparty({
          name: counterpartyName,
          userId: data.userId!,
          categoryIds: categoryIds.filter((id) => id),
        });

        if (counterpartyResult.data) {
          counterpartyId = counterpartyResult.data.id;

          if (counterpartyResult.data.categoryIds?.length) {
            categoryIds = [
              ...new Set([...categoryIds, ...counterpartyResult.data.categoryIds])
            ];
          }
        }
      }

      const transactionData = {
        ...data,
        categoryIds,
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
