import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";
import { cascadeDeleteCounterparty } from "../sync/cascade-delete-counterparty";

export type IAPIDeleteCounterparty = {
  id: string;
  userId: string;
} & IAPIRequestCommon<boolean>;

export const deleteCounterparty = async ({ id, userId, options }: IAPIDeleteCounterparty) => {
  const response = await handleAppRequest(
    async () => {
      await cascadeDeleteCounterparty({ counterpartyId: id, userId });

      await firebaseDelete({
        collection: "creditors",
        id,
      });

      return true;
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Terceiro" }),
      ...options,
    }
  );
  return response;
};
