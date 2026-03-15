import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IBudget, IBudgetBase } from "~/@schemas/models/budget";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type IProps = {
  data: IBudgetBase & { id: string };
} & IAPIRequestCommon<IBudget>;

export type IAPICreateBudget = IProps;

export const createBudget = async ({ data, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseCreate<typeof data, IBudget>({
        collection: "budgets",
        data,
      });
    },
    {
      toastOptions: getDefaultCreateToastOptions({ itemName: "Orçamento" }),
      ...options,
    }
  );
  return response;
};
