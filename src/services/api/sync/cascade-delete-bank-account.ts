import { writeBatch, type WriteBatch } from "firebase/firestore";
import type { ITransaction } from "~/@schemas/models/transaction";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseDeleteMany } from "~/services/firebase/firebaseDeleteMany";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";

type IProps = {
  bankAccountId: string;
  userId: string;
  batch?: WriteBatch;
};

export const cascadeDeleteBankAccount = async ({ bankAccountId, userId, batch: _batch }: IProps) => {
  const { firebaseDB } = useFirebaseStore();

  const transactions = await firebaseList<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "bankAccountId", operator: "==", value: bankAccountId },
    ],
  });

  const batch = _batch || writeBatch(firebaseDB);

  if (transactions.length > 0) {
    await firebaseDeleteMany({
      collection: "transactions",
      ids: transactions.map((t) => t.id),
      batch,
    });
  }

  await firebaseDelete({
    collection: "reports",
    id: bankAccountId,
    batch,
  });

  if (!_batch) await batch.commit();
};
