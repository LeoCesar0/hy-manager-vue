import type {
  ITransaction,
  IUpdateTransaction,
} from "~/@schemas/models/transaction";
import type { AppResponse } from "~/@schemas/app";
import { getOrCreateCreditor } from "../creditors/get-or-create-creditor";

export const updateTransaction = async (
  id: string,
  data: IUpdateTransaction,
  creditorName?: string
): Promise<AppResponse<ITransaction>> => {
  const firebaseStore = useFirebaseStore();

  let counterpartyId = data.counterpartyId;

  if (creditorName && !counterpartyId) {
    const categoryIds = data.categoryIds || [];
    const creditorResult = await getOrCreateCreditor({
      name: creditorName,
      userId: data.userId,
      categoryIds: categoryIds.filter((id) => id),
    });

    if (creditorResult.data) {
      counterpartyId = creditorResult.data.id;
    }
  }

  const transactionData = {
    ...data,
    counterpartyId: counterpartyId || null,
  };

  return await firebaseStore.modelUpdate<IUpdateTransaction, ITransaction>({
    collection: "transactions",
    id,
    data: transactionData,
  });
};
