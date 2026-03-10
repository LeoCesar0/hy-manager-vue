import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IReport, IReportBase } from "~/@schemas/models/report";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";

type IProps = {
  bankAccountId: string;
  data: Partial<IReportBase>;
} & IAPIRequestCommon<IReport>;

export const saveReport = async ({ bankAccountId, data, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseUpdate<IReportBase, IReport>({
        collection: "reports",
        id: bankAccountId,
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
