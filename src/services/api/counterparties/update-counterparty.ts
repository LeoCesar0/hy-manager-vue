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
import { slugify } from "~/helpers/slugify";

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

      // Keep slugifiedName in sync whenever the name changes.
      const dataWithSlug = data.name
        ? { ...data, slugifiedName: slugify(data.name) }
        : data;

      const result = await firebaseUpdate<
        IUpdateCounterparty & { slugifiedName?: string },
        Item
      >({
        collection: "creditors",
        id,
        data: dataWithSlug,
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

