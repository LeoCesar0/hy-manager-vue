import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ICounterparty,
  ICreateCounterparty,
} from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = ICounterparty;

export type IAPICreateCreditor = {
  data: ICreateCounterparty;
} & IAPIRequestCommon<Item>;

export const createCreditor = async ({ data, options }: IAPICreateCreditor) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate({
        collection: "creditors",
        data,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Terceiro" }),
      ...options,
    }
  );
  return response;
};

