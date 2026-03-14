import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import type { IReport, IReportBase } from "~/@schemas/models/report";
import { deleteField, updateDoc, type FieldValue } from "firebase/firestore";
import { createDocRef } from "~/services/firebase/createDocRef";
import { removeCategoryFromTransactions } from "./remove-category-from-transactions";
import { removeCategoryFromCounterparties } from "./remove-category-from-counterparties";

type IProps = {
  categoryId: string;
  userId: string;
};

export const cascadeDeleteCategory = async ({ categoryId, userId }: IProps) => {
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

  const updatePromises: Promise<unknown>[] = [];

  if (changedTransactions.length > 0) {
    updatePromises.push(
      firebaseUpdateMany({
        collection: "transactions",
        items: changedTransactions.map((t) => ({
          id: t.id,
          data: { categoryIds: t.categoryIds },
        })),
      })
    );
  }

  if (changedCounterparties.length > 0) {
    updatePromises.push(
      firebaseUpdateMany({
        collection: "creditors",
        items: changedCounterparties.map((cp) => ({
          id: cp.id,
          data: { categoryIds: cp.categoryIds },
        })),
      })
    );
  }

  await Promise.all(updatePromises);

  // Update reports for affected bank accounts
  // Use deleteField() to remove map keys — setDoc merge won't remove them otherwise
  const bankAccountIds = [...new Set(changedTransactions.map((t) => t.bankAccountId))];

  await Promise.all(
    bankAccountIds.map(async (bankAccountId) => {
      try {
        await firebaseGet<IReport>({ collection: "reports", id: bankAccountId });

        const docRef = createDocRef({ collection: "reports", id: bankAccountId });

        await updateDoc(docRef, {
          [`expensesByCategory.${categoryId}`]: deleteField(),
          [`depositsByCategory.${categoryId}`]: deleteField(),
        });
      } catch {
        // Report may not exist — safe to skip
      }
    })
  );
};
