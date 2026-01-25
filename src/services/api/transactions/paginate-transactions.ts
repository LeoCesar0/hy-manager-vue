import type { ITransaction } from "~/@schemas/models/transaction";
import type { AppResponse } from "~/@schemas/app";
import type { Timestamp } from "firebase/firestore";
import type { FirebaseFilterFor } from "~/services/firebase/@type";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";

type IProps = {
  userId: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  categoryId?: string;
  counterpartyId?: string;
  bankAccountId?: string;
  type?: "deposit" | "expense";
  pagination: IPaginationBody;
};

export const paginateTransactions = async ({
  userId,
  startDate,
  endDate,
  categoryId,
  counterpartyId,
  bankAccountId,
  type,
  pagination
}: IProps): Promise<AppResponse<IPaginationResult<ITransaction>>> => {
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
      field: "categoryIds",
      operator: "array-contains",
      value: categoryId,
    });
  }

  if (counterpartyId) {
    filters.push({
      field: "counterpartyId",
      operator: "==",
      value: counterpartyId,
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

  return await firebaseStore.modelPaginatedList<ITransaction>({
    collection: "transactions",
    filters,
    pagination:pagination
  });
};
