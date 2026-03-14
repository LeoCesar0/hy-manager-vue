import type { ITransaction } from "~/@schemas/models/transaction";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseDeleteMany } from "~/services/firebase/firebaseDeleteMany";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";

type IProps = {
  bankAccountId: string;
  userId: string;
};

export const cascadeDeleteBankAccount = async ({ bankAccountId, userId }: IProps) => {
  const transactions = await firebaseList<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "bankAccountId", operator: "==", value: bankAccountId },
    ],
  });

  if (transactions.length > 0) {
    await firebaseDeleteMany({
      collection: "transactions",
      ids: transactions.map((t) => t.id),
    });
  }

  await firebaseDelete({
    collection: "reports",
    id: bankAccountId,
  });
};
