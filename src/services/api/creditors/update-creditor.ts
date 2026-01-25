import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ICounterparty,
  IUpdateCounterparty,
} from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";

type Item = ICounterparty;

export type IAPIUpdateCreditor = {
  id: string;
  data: IUpdateCounterparty;
} & IAPIRequestCommon<Item>;

export const updateCreditor = async ({ id, data, options }: IAPIUpdateCreditor) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate({
        collection: "creditors",
        id,
        data,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Terceiro" }),
      ...options,
    }
  );
  return response;
};

