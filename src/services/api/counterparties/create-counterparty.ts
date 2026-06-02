import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type {
  ICounterparty,
  ICreateCounterparty,
} from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";
import { slugify } from "~/helpers/slugify";

type Item = ICounterparty;

export type IAPICreateCounterparty = {
  data: ICreateCounterparty;
} & IAPIRequestCommon<Item>;

export const createCounterparty = async ({ data, options }: IAPICreateCounterparty) => {
  const response = await handleAppRequest(
    async () => {
      const dataWithSlug = { ...data, slugifiedName: slugify(data.name) };
      return firebaseCreate<ICreateCounterparty & { slugifiedName: string }, Item>({
        collection: "creditors",
        data: dataWithSlug,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Identificador" }),
      ...options,
    }
  );
  return response;
};

