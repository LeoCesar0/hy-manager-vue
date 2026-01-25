import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { createCreditor } from "./create-creditor";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = ICounterparty;

export type IAPIGetOrCreateCreditor = {
  name: string;
  userId: string;
  categoryIds?: string[];
} & IAPIRequestCommon<Item>;

export const getOrCreateCreditor = async ({ 
  name, 
  userId, 
  categoryIds = [],
  options 
}: IAPIGetOrCreateCreditor) => {
  const response = await handleAppRequest(
    async () => {
      const normalizedName = name.trim().toLowerCase();

      const existingList = await firebaseList<Item>({
        collection: "creditors",
        filters: [
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
        ],
      });

      const existing = existingList.find(
        (c) => c.name.toLowerCase() === normalizedName
      );

      if (existing) {
        return existing;
      }

      const createResult = await createCreditor({
        data: {
          name: name.trim(),
          userId,
          categoryIds,
        },
        options: {
          toastOptions:{
            error:true,
            loading:false,
            success: false
          }
        }
      });

      if (!createResult.data) {
        throw new Error("Failed to create creditor");
      }

      return createResult.data;
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Terceiro" }),
      ...options,
    }
  );
  return response;
};

