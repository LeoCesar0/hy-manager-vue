import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  IUser,
  IUpdateUser,
} from "~/@schemas/models/user";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { getDefaultUpdateToastOptions } from "~/helpers/toast/get-default-update-toast-options";

type Item = IUser;

export type IAPIUpdateUser = {
  id: string;
  data: Partial<IUpdateUser>;
} & IAPIRequestCommon<Item>;

export const updateUser = async ({ id, data, options }: IAPIUpdateUser) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate({
        collection: "users",
        id,
        data,
      });
    },
    {
      toastOptions: getDefaultUpdateToastOptions({ itemName: "Usuário" }),
      ...options,
    }
  );
  return response;
};
