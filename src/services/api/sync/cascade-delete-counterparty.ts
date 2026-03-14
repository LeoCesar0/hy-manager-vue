import type { ITransaction } from "~/@schemas/models/transaction";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import type { IReport } from "~/@schemas/models/report";
import { deleteField, writeBatch } from "firebase/firestore";
import { createDocRef } from "~/services/firebase/createDocRef";
import { removeCounterpartyFromTransactions } from "./remove-counterparty-from-transactions";

type IProps = {
  counterpartyId: string;
  userId: string;
};

export const cascadeDeleteCounterparty = async ({ counterpartyId, userId }: IProps) => {
  const { firebaseDB } = useFirebaseStore();

  const transactions = await firebaseList<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "counterpartyId", operator: "==", value: counterpartyId },
    ],
  });

  const changedTransactions = removeCounterpartyFromTransactions({ counterpartyId, transactions });

  const batch = writeBatch(firebaseDB);

  if (changedTransactions.length > 0) {
    await firebaseUpdateMany({
      collection: "transactions",
      items: changedTransactions.map((t) => ({
        id: t.id,
        data: { counterpartyId: null },
      })),
      batch,
    });
  }

  // Update reports for affected bank accounts
  // Use deleteField() to remove map keys — setDoc merge won't remove them otherwise
  const bankAccountIds = [...new Set(changedTransactions.map((t) => t.bankAccountId))];

  await Promise.all(
    bankAccountIds.map(async (bankAccountId) => {
      try {
        await firebaseGet<IReport>({ collection: "reports", id: bankAccountId });

        const docRef = createDocRef({ collection: "reports", id: bankAccountId });

        batch.update(docRef, {
          [`expensesByCounterparty.${counterpartyId}`]: deleteField(),
          [`depositsByCounterparty.${counterpartyId}`]: deleteField(),
        });
      } catch {
        // Report may not exist — safe to skip
      }
    })
  );

  await batch.commit();
};
