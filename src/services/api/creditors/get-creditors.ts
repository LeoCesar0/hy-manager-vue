import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICounterparty;

export type IAPIGetCreditors = {
  userId: string;
} & IAPIRequestCommon<Item[]>;

export const getCreditors = async ({ userId, options }: IAPIGetCreditors) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseList<Item>({
        collection: "creditors",
        filters: [
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
        ],
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Terceiros" }),
      ...options,
    }
  );
  return response;
};

