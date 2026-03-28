import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICounterparty;

export type IAPIGetUncategorizedCounterparties = {
  userId: string;
} & IAPIRequestCommon<Item[]>;

export const getUncategorizedCounterparties = async ({ userId, options }: IAPIGetUncategorizedCounterparties) => {
  const response = await handleAppRequest(
    async () => {
      const all = await firebaseList<Item>({
        collection: "creditors",
        filters: [
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
        ],
      });
      return all.filter((c) => !c.categoryIds || c.categoryIds.length === 0);
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Terceiros sem categoria" }),
      ...options,
    }
  );
  return response;
};
