import type { ITransaction } from "~/@schemas/models/transaction";
import type { AppResponse } from "~/@schemas/app";
import type { Timestamp } from "firebase/firestore";
import type { FirebaseFilterFor } from "~/services/firebase/@type";

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

  const filters: FirebaseFilterFor<ITransaction>[] = [
    {
      field: "userId",
      operator: "==",
      value: userId,
    },
  ];

  if (startDate) {
    filters.push({
      field: "date",
      operator: ">=",
      value: startDate,
    });
  }

  if (endDate) {
    filters.push({
      field: "date",
      operator: "<=",
      value: endDate,
    });
  }

  if (categoryId) {
    filters.push({
      field: "categoryId",
      operator: "==",
      value: categoryId,
    });
  }

  if (creditorId) {
    filters.push({
      field: "creditorId",
      operator: "==",
      value: creditorId,
    });
  }

  if (bankAccountId) {
    filters.push({
      field: "bankAccountId",
      operator: "==",
      value: bankAccountId,
    });
  }

  if (type) {
    filters.push({
      field: "type",
      operator: "==",
      value: type,
    });
  }

  return await firebaseStore.modelList<ITransaction>({
    collection: "transactions",
    filters,
  });
};
