import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";

export type IAPIDeleteCounterparty = {
  id: string;
} & IAPIRequestCommon<boolean>;

export const deleteCounterparty = async ({ id, options }: IAPIDeleteCounterparty) => {
  const response = await handleAppRequest(
    async () => {
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
