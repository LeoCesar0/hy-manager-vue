import type { ITransaction } from "~/@schemas/models/transaction";
import { cascadePaginatedBatch } from "~/services/firebase/cascadePaginatedBatch";
import { createDocRef } from "~/services/firebase/createDocRef";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";

type IProps = {
  bankAccountId: string;
  userId: string;
};

// Atomicity with the parent `deleteBankAccount` call was already lost past 500 ops;
// the cascade commits its own chunked batches and the caller handles the parent doc.
export const cascadeDeleteBankAccount = async ({ bankAccountId, userId }: IProps) => {
  await cascadePaginatedBatch<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "bankAccountId", operator: "==", value: bankAccountId },
    ],
    onPage: ({ items, batch }) => {
      for (const tx of items) {
        batch.delete(createDocRef({ collection: "transactions", id: tx.id }));
      }
    },
  });

  await firebaseDelete({
    collection: "reports",
    id: bankAccountId,
  });
};
