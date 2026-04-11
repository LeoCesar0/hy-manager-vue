import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICounterparty;

export type IAPIGetCounterparty = {
  id: string;
} & IAPIRequestCommon<Item | null>;

export const getCounterparty = async ({ id, options }: IAPIGetCounterparty) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet<Item>({
        collection: "creditors",
        id,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Identificador" }),
      ...options,
    },
  );
  return response;
};
