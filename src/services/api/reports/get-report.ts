import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IReport } from "~/@schemas/models/report";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";

type IProps = {
  bankAccountId: string;
} & IAPIRequestCommon<IReport>;

export const getReport = async ({ bankAccountId, options }: IProps) => {
  const response = await handleAppRequest(
    async () => {
      return firebaseGet<IReport>({
        collection: "reports",
        id: bankAccountId,
      });
    },
    {
      toastOptions: undefined,
      ...options,
    }
  );
  return response;
};
