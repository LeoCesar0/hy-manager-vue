import type { ITransaction } from "~/@schemas/models/transaction";
import { cascadePaginatedBatch } from "~/services/firebase/cascadePaginatedBatch";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import type { IReport } from "~/@schemas/models/report";
import { deleteField, writeBatch } from "firebase/firestore";
import { createDocRef } from "~/services/firebase/createDocRef";
import { removeCounterpartyFromTransactions } from "./remove-counterparty-from-transactions";

type IProps = {
  counterpartyId: string;
  userId: string;
};

// Self-managed batching (see cascade-delete-bank-account for rationale).
export const cascadeDeleteCounterparty = async ({ counterpartyId, userId }: IProps) => {
  const { firebaseDB } = useFirebaseStore();
  const affectedBankAccountIds = new Set<string>();

  await cascadePaginatedBatch<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "counterpartyId", operator: "==", value: counterpartyId },
    ],
    onPage: ({ items, batch }) => {
      const changed = removeCounterpartyFromTransactions({ counterpartyId, transactions: items });
      for (const tx of changed) {
        affectedBankAccountIds.add(tx.bankAccountId);
        batch.update(
          createDocRef({ collection: "transactions", id: tx.id }),
          { counterpartyId: null }
        );
      }
    },
  });

  if (affectedBankAccountIds.size === 0) return;

  // Report map updates — bounded by number of bank accounts (always far under 500).
  // Use deleteField() to remove map keys — setDoc merge won't remove them otherwise.
  const reportBatch = writeBatch(firebaseDB);
  let reportOps = 0;

  await Promise.all(
    [...affectedBankAccountIds].map(async (bankAccountId) => {
      try {
        await firebaseGet<IReport>({ collection: "reports", id: bankAccountId });

        reportBatch.update(createDocRef({ collection: "reports", id: bankAccountId }), {
          [`expensesByCounterparty.${counterpartyId}`]: deleteField(),
          [`depositsByCounterparty.${counterpartyId}`]: deleteField(),
        });
        reportOps++;
      } catch {
        // Report may not exist — safe to skip
      }
    })
  );

  if (reportOps > 0) await reportBatch.commit();
};
