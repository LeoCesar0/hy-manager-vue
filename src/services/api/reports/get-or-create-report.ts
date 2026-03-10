import type { IReport } from "~/@schemas/models/report";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { createEmptyReport } from "./create-empty-report";

type IProps = {
  userId: string;
  bankAccountId: string;
} & IAPIRequestCommon<IReport>;

export const getOrCreateReport = async ({ userId, bankAccountId, options }: IProps) => {
  try {
    const data = await firebaseGet<IReport>({
      collection: "reports",
      id: bankAccountId,
    });

    return { data, error: null };
  } catch {
    return createEmptyReport({
      userId,
      bankAccountId,
      options,
    });
  }
};
