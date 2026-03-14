import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import type { IReport } from "~/@schemas/models/report";
import { deleteField, writeBatch, type WriteBatch } from "firebase/firestore";
import { createDocRef } from "~/services/firebase/createDocRef";
import { removeCategoryFromTransactions } from "./remove-category-from-transactions";
import { removeCategoryFromCounterparties } from "./remove-category-from-counterparties";

type IProps = {
  categoryId: string;
  userId: string;
  batch?: WriteBatch;
};

export const cascadeDeleteCategory = async ({ categoryId, userId, batch: _batch }: IProps) => {
  const { firebaseDB } = useFirebaseStore();

  const [transactions, counterparties] = await Promise.all([
    firebaseList<ITransaction>({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: userId },
        { field: "categoryIds", operator: "array-contains", value: categoryId },
      ],
    }),
    firebaseList<ICounterparty>({
      collection: "creditors",
      filters: [
        { field: "userId", operator: "==", value: userId },
        { field: "categoryIds", operator: "array-contains", value: categoryId },
      ],
    }),
  ]);

  const changedTransactions = removeCategoryFromTransactions({ categoryId, transactions });
  const changedCounterparties = removeCategoryFromCounterparties({ categoryId, counterparties });

  const batch = _batch || writeBatch(firebaseDB);

  if (changedTransactions.length > 0) {
    await firebaseUpdateMany({
      collection: "transactions",
      items: changedTransactions.map((t) => ({
        id: t.id,
        data: { categoryIds: t.categoryIds },
      })),
      batch,
    });
  }

  if (changedCounterparties.length > 0) {
    await firebaseUpdateMany({
      collection: "creditors",
      items: changedCounterparties.map((cp) => ({
        id: cp.id,
        data: { categoryIds: cp.categoryIds },
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
          [`expensesByCategory.${categoryId}`]: deleteField(),
          [`depositsByCategory.${categoryId}`]: deleteField(),
        });
      } catch {
        // Report may not exist — safe to skip
      }
    })
  );

  if (!_batch) await batch.commit();
};
