import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { cascadePaginatedBatch } from "~/services/firebase/cascadePaginatedBatch";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import type { IReport } from "~/@schemas/models/report";
import { deleteField, writeBatch } from "firebase/firestore";
import { createDocRef } from "~/services/firebase/createDocRef";
import { removeCategoryFromTransactions } from "./remove-category-from-transactions";
import { removeCategoryFromCounterparties } from "./remove-category-from-counterparties";

type IProps = {
  categoryId: string;
  userId: string;
};

// Self-managed batching (see cascade-delete-bank-account for rationale).
export const cascadeDeleteCategory = async ({ categoryId, userId }: IProps) => {
  const { firebaseDB } = useFirebaseStore();
  const affectedBankAccountIds = new Set<string>();

  await cascadePaginatedBatch<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "categoryIds", operator: "array-contains", value: categoryId },
    ],
    onPage: ({ items, batch }) => {
      const changed = removeCategoryFromTransactions({ categoryId, transactions: items });
      for (const tx of changed) {
        affectedBankAccountIds.add(tx.bankAccountId);
        batch.update(
          createDocRef({ collection: "transactions", id: tx.id }),
          { categoryIds: tx.categoryIds }
        );
      }
    },
  });

  await cascadePaginatedBatch<ICounterparty>({
    collection: "creditors",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "categoryIds", operator: "array-contains", value: categoryId },
    ],
    onPage: ({ items, batch }) => {
      const changed = removeCategoryFromCounterparties({ categoryId, counterparties: items });
      for (const cp of changed) {
        batch.update(
          createDocRef({ collection: "creditors", id: cp.id }),
          { categoryIds: cp.categoryIds }
        );
      }
    },
  });

  if (affectedBankAccountIds.size === 0) return;

  // Report map updates — bounded by number of affected accounts (always far under 500).
  // Use deleteField() to remove map keys — setDoc merge won't remove them otherwise.
  const reportBatch = writeBatch(firebaseDB);
  let reportOps = 0;

  await Promise.all(
    [...affectedBankAccountIds].map(async (bankAccountId) => {
      try {
        await firebaseGet<IReport>({ collection: "reports", id: bankAccountId });

        reportBatch.update(createDocRef({ collection: "reports", id: bankAccountId }), {
          [`expensesByCategory.${categoryId}`]: deleteField(),
          [`depositsByCategory.${categoryId}`]: deleteField(),
        });
        reportOps++;
      } catch {
        // Report may not exist — safe to skip
      }
    })
  );

  if (reportOps > 0) await reportBatch.commit();
};
