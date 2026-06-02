import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { createCounterparty } from "./create-counterparty";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";
import { slugify } from "~/helpers/slugify";

type Item = ICounterparty;

export type IAPIGetOrCreateCounterparty = {
  name: string;
  userId: string;
  categoryIds?: string[];
} & IAPIRequestCommon<Item>;

export const getOrCreateCounterparty = async ({
  name,
  userId,
  categoryIds = [],
  options
}: IAPIGetOrCreateCounterparty) => {
  const response = await handleAppRequest(
    async () => {
      const normalizedName = slugify(name);

      // Indexed lookup by slugifiedName (userId + slugifiedName composite index)
      // instead of fetching the whole collection and matching in memory.
      const existingList = await firebaseList<Item>({
        collection: "creditors",
        filters: [
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
          {
            field: "slugifiedName",
            operator: "==",
            value: normalizedName,
          },
        ],
      });

      const existing = existingList[0];

      if (existing) {
        return existing;
      }

      const createResult = await createCounterparty({
        data: {
          name: name.trim(),
          userId,
          categoryIds,
        },
        options: {
          toastOptions: {
            error: true,
            loading: false,
            success: false,
          },
        }
      });

      if (!createResult.data) {
        throw new Error("Failed to create counterparty");
      }

      return createResult.data;
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Identificador" }),
      ...options,
    }
  );
  return response;
};
