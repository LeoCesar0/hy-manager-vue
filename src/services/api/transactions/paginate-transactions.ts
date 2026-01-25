import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { Timestamp } from "firebase/firestore";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import type { IAPIRequestCommon } from "../@types";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ITransaction;

export type IAPIPaginateTransactions = {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryId?: string;
  counterpartyId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
  pagination: IPaginationBody;
} & IAPIRequestCommon<IPaginationResult<Item>>;

export const paginateTransactions = async ({
  userId,
  startDate,
  endDate,
  categoryId,
  counterpartyId,
  bankAccountId,
  type,
  pagination,
  options
}: IAPIPaginateTransactions) => {
  const response = await handleAppRequest(
    async () => {
      const filters: FirebaseFilterFor<ITransaction>[] = [
        {
          field: "userId",
          operator: "==",
          value: userId,
        },
      ];

      if (startDate) {
        filters.push({
          field: "date",
          operator: ">=",
          value: startDate,
        });
      }

      if (endDate) {
        filters.push({
          field: "date",
          operator: "<=",
          value: endDate,
        });
      }

      if (categoryId) {
        filters.push({
          field: "categoryIds",
          operator: "array-contains",
          value: categoryId,
        });
      }

      if (counterpartyId) {
        filters.push({
          field: "counterpartyId",
          operator: "==",
          value: counterpartyId,
        });
      }

      if (bankAccountId) {
        filters.push({
          field: "bankAccountId",
          operator: "==",
          value: bankAccountId,
        });
      }

      if (type) {
        filters.push({
          field: "type",
          operator: "==",
          value: type,
        });
      }

      return await firebasePaginatedList<Item>({
        collection: "transactions",
        filters,
        pagination
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Transações" }),
      ...options,
    }
  );
  return response;
};

