import {
  handleAppRequest,
} from "../@handlers/handle-app-request";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IAPIRequestCommon } from "../@types";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { getDefaultDeleteToastOptions } from "~/helpers/toast/get-default-delete-toast-options";
import { updateReport } from "../reports/update-report";

export type IAPIDeleteTransaction = {
  id: string;
} & IAPIRequestCommon<void>;

export const deleteTransaction = async ({
  id,
  options
}: IAPIDeleteTransaction) => {
  const response = await handleAppRequest(
    async () => {
      const oldTransaction = await firebaseGet<ITransaction>({
        collection: "transactions",
        id,
      });

      await firebaseDelete({
        collection: "transactions",
        id,
      });

      await updateReport({
        userId: oldTransaction.userId,
        bankAccountId: oldTransaction.bankAccountId,
        oldTransaction,
      });
    },
    {
      toastOptions: getDefaultDeleteToastOptions({ itemName: "Transação" }),
      ...options,
    }
  );
  return response;
};

