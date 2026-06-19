import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IBudget } from "~/@schemas/models/budget";
import type { IAPIRequestCommon } from "../@types";
import { firebaseList } from "~/services/firebase/firebaseList";
import { getDefaultGetToastOptions } from "~/helpers/toast/get-default-get-toast-options";

type IProps = {
  userId: string;
} & IAPIRequestCommon<IBudget[]>;

export type IAPIListBudgets = IProps;

// Lists every objetivo (budget) doc owned by the user. The Objetivos page joins
// this against the dashboard store's bank-account list to render one row per
// account — including accounts without a budget doc yet (the "Criar objetivo"
// rows). Single-field `userId` filter, so no composite Firestore index is
// needed.
export const listBudgets = async ({ userId, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseList<IBudget>({
        collection: "budgets",
        filters: [
          {
            field: "userId",
            operator: "==",
            value: userId,
          },
        ],
      });
    },
    {
      toastOptions: getDefaultGetToastOptions({ itemName: "Objetivos" }),
      ...options,
    }
  );
  return response;
};
