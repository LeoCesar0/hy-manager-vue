import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import {
  handleAppRequest,
  type IHandleAppRequestProps,
} from "../@handlers/handle-app-request";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import { DISPLAY_ERROR } from "~/services/app/display-error";

type Item = IBankAccount;

export type IAPIGetBankAccounts = {
  userId: string;
  pagination?: IPaginationBody;
  filters?: FirebaseFilterFor<IBankAccount>[];
  options?: IHandleAppRequestProps<IPaginationResult<Item>>;
};

export const getBankAccounts = async ({
  userId,
  pagination,
  options,
  filters,
}: IAPIGetBankAccounts) => {
  const response = await handleAppRequest(
    async () => {
      return await firebasePaginatedList<Item>({
        collection: "bankAccounts",
        filters: [
          ...(filters ?? []),
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
        ],
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
