import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import {
  handleAppRequest,
  type IHandleAppRequestProps,
} from "../@handlers/handle-app-request";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import type { ICreateUser, IUser } from "~/@schemas/models/user";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type Item = IUser;

export type IAPIGetUser = {
  userId: string;
  options?: IHandleAppRequestProps<Item>;
};

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
