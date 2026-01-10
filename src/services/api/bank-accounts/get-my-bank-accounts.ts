import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import {
  handleAppRequest,
  type IHandleAppRequestProps,
} from "../@handlers/handle-app-request";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";

type Item = IBankAccount;

export type IGetMyBankAccounts = {
  userId: string;
  pagination?: IPaginationBody;
  options?: IHandleAppRequestProps<IPaginationResult<Item>>;
};

export const getMyBankAccounts = async ({
  userId,
  pagination,
  options,
}: IGetMyBankAccounts) => {
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
      ...options,
    }
  );
  return response;
};
