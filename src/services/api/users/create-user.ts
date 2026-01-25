import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import {
  handleAppRequest,
  type IHandleAppRequestProps,
} from "../@handlers/handle-app-request";
import type { ICreateUser, IUser } from "~/@schemas/models/user";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = IUser;

export type IAPICreateUser = {
  data: ICreateUser;
} & IAPIRequestCommon<Item>;

export const createUser = async ({ data, options }: IAPICreateUser) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate({
        collection: "users",
        data: {
          ...data,
        },
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Usuário" }),
      ...options,
    }
  );
  return response;
};
