import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IReport, IReportBase } from "~/@schemas/models/report";
import type { IAPIRequestCommon } from "../@types";
import { firebaseCreate } from "~/services/firebase/firebaseCreate";

type IProps = {
  userId: string;
  bankAccountId: string;
} & IAPIRequestCommon<IReport>;

export const createEmptyReport = async ({ userId, bankAccountId, options }: IProps) => {
  const data: IReportBase & { id: string } = {
    id: bankAccountId,
    userId,
    bankAccountId,
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0,
    expensesByCategory: {},
    depositsByCategory: {},
    expensesByCounterparty: {},
    depositsByCounterparty: {},
    monthlyBreakdown: {},
  };

  const response = await handleAppRequest(
    async () => {
      return firebaseCreate<typeof data, IReport>({
        collection: "reports",
        data,
      });
    },
    {
      toastOptions: undefined,
      ...options,
    }
  );
  return response;
};
