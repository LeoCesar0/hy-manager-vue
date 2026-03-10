import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IAPIRequestCommon } from "../@types";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ITransaction;

export type IAPIGetTransactions = {
  userId: string;
  bankAccountId?: string;
  filters?: FirebaseFilterFor<Item>[];
} & IAPIRequestCommon<Item[]>;

export const getTransactions = async ({
  userId,
  bankAccountId,
  filters: extraFilters = [],
  options,
}: IAPIGetTransactions) => {
  const response = await handleAppRequest(
    async () => {
      const filters: FirebaseFilterFor<Item>[] = [
        {
          field: "userId",
          operator: "==",
          value: userId,
        },
        ...extraFilters,
      ];

      if (bankAccountId) {
        filters.push({
          field: "bankAccountId",
          operator: "==",
          value: bankAccountId,
        });
      }

      console.log(`❗ getTransactions filters -->`, filters);

      return firebaseList<Item>({
        collection: "transactions",
        filters,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Transações" }),
      ...options,
    }
  );
  return response;
};
