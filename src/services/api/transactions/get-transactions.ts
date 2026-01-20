import type { ITransaction } from "~/@schemas/models/transaction";
import type { AppResponse } from "~/@schemas/app";
import type { Timestamp } from "firebase/firestore";

type IProps = {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryId?: string;
  creditorId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
};

export const getTransactions = async ({
  userId,
  startDate,
  endDate,
  categoryId,
  creditorId,
  bankAccountId,
  type,
}: IProps): Promise<AppResponse<ITransaction[]>> => {
  const firebaseStore = useFirebaseStore();

  const where: Array<{
    field: string;
    operator: any;
    value: any;
  }> = [
    {
      field: "userId",
      operator: "==",
      value: userId,
    },
  ];

  if (startDate) {
    where.push({
      field: "date",
      operator: ">=",
      value: startDate,
    });
  }

  if (endDate) {
    where.push({
      field: "date",
      operator: "<=",
      value: endDate,
    });
  }

  if (categoryId) {
    where.push({
      field: "categoryId",
      operator: "==",
      value: categoryId,
    });
  }

  if (creditorId) {
    where.push({
      field: "creditorId",
      operator: "==",
      value: creditorId,
    });
  }

  if (bankAccountId) {
    where.push({
      field: "bankAccountId",
      operator: "==",
      value: bankAccountId,
    });
  }

  if (type) {
    where.push({
      field: "type",
      operator: "==",
      value: type,
    });
  }

  return await firebaseStore.modelList<ITransaction>({
    collection: "transactions",
    where,
    orderBy: [{ field: "date", direction: "desc" }],
  });
};
