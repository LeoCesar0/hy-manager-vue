import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ICreateUser, IUser } from "~/@schemas/models/user";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";
import type { IAPIRequestCommon } from "../@types";

type Item = IUser;

export type IAPIGetUser = {
  userId: string;
} & IAPIRequestCommon<Item>;

export const getUserById = async ({ userId, options }: IAPIGetUser) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet({
        collection: "users",
        id: userId,
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "User" }),
      ...options,
    }
  );
  return response;
};
