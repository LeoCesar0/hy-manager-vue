import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import {
  handleAppRequest,
  type IHandleAppRequestProps,
} from "../@handlers/handle-app-request";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options copy 2";

type Item = IBankAccount;

export type IAPIGetMyBankAccounts = {
  userId: string;
  pagination?: IPaginationBody;
  options?: IHandleAppRequestProps<IPaginationResult<Item>>;
};

export const getMyBankAccounts = async ({
  userId,
  pagination,
  options,
}: IAPIGetMyBankAccounts) => {
  const response = await handleAppRequest(
    async () => {
      return await firebasePaginatedList<Item>({
        collection: "bankAccounts",
        // filters: [
        //   {
        //     field: "userId",
        //     operator: "==",
        //     value: userId,
        //   },
        // ],
        pagination: pagination ?? {
          page: 1,
          limit: 10,
        },
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Bank Account" }),
      ...options,
    }
  );
  return response;
};
