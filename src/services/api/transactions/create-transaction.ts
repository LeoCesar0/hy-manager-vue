import type {
  ITransaction,
  ICreateTransaction,
} from "~/@schemas/models/transaction";
import type { AppResponse } from "~/@schemas/app";
import { getOrCreateCreditor } from "../creditors/get-or-create-creditor";

export const createTransaction = async (
  data: ICreateTransaction,
  creditorName?: string
): Promise<AppResponse<ITransaction>> => {
  const firebaseStore = useFirebaseStore();

  let creditorId = data.creditorId;

  if (creditorName && !creditorId) {
    const categoryIds = data.categorySplits?.map((s) => s.categoryId) || [];
    const creditorResult = await getOrCreateCreditor({
      name: creditorName,
      userId: data.userId,
      categoryIds: categoryIds.filter((id) => id),
    });

    if (creditorResult.data) {
      creditorId = creditorResult.data.id;
    }
  }

  const transactionData = {
    ...data,
    creditorId: creditorId || null,
  };

  return await firebaseStore.modelCreate<ICreateTransaction, ITransaction>({
    collection: "transactions",
    data: transactionData,
  });
};
