import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ICounterparty,
  IUpdateCounterparty,
} from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";
import { cascadeUpdateCounterpartyCategoryIds } from "../sync/cascade-update-counterparty-category-ids";

type Item = ICounterparty;

export type IAPIUpdateCounterparty = {
  id: string;
  userId: string;
  data: IUpdateCounterparty;
} & IAPIRequestCommon<Item>;

export const updateCounterparty = async ({ id, userId, data, options }: IAPIUpdateCounterparty) => {
  const response = await handleAppRequest(
    async () => {
      const oldCounterparty = await firebaseGet<ICounterparty>({
        collection: "creditors",
        id,
      });

      const result = await firebaseUpdate<IUpdateCounterparty, Item>({
        collection: "creditors",
        id,
        data,
      });

      if (data.categoryIds) {
        cascadeUpdateCounterpartyCategoryIds({
          counterpartyId: id,
          oldCategoryIds: oldCounterparty.categoryIds,
          newCategoryIds: data.categoryIds,
          userId,
        });
      }

      return result;
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Identificador" }),
      ...options,
    }
  );
  return response;
};

