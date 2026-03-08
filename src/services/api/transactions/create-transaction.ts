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
import { getOrCreateCounterparty } from "../counterparties/get-or-create-counterparty";

type Item = ITransaction;

export type IAPICreateTransaction = {
  data: ICreateTransaction;
  counterpartyName?: string;
} & IAPIRequestCommon<Item>;

export const createTransaction = async ({
  data,
  counterpartyName,
  options
}: IAPICreateTransaction) => {
  const response = await handleAppRequest(
    async () => {
      let counterpartyId = data.counterpartyId;
      let categoryIds = data.categoryIds || [];

      if (counterpartyName && !counterpartyId) {
        const counterpartyResult = await getOrCreateCounterparty({
          name: counterpartyName,
          userId: data.userId,
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
