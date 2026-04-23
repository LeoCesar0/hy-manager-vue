import type { ITransaction } from "~/@schemas/models/transaction";
import { cascadePaginatedBatch } from "~/services/firebase/cascadePaginatedBatch";
import { createDocRef } from "~/services/firebase/createDocRef";
import { rebuildReport } from "~/services/api/reports/rebuild-report";
import { applyCategoryIdsDiffToTransactions } from "./apply-category-ids-diff-to-transactions";

type IProps = {
  counterpartyId: string;
  oldCategoryIds: string[];
  newCategoryIds: string[];
  userId: string;
};

export const cascadeUpdateCounterpartyCategoryIds = async ({
  counterpartyId,
  oldCategoryIds,
  newCategoryIds,
  userId,
}: IProps) => {
  const oldSet = new Set(oldCategoryIds);
  const newSet = new Set(newCategoryIds);

  const addedCategoryIds = newCategoryIds.filter((id) => !oldSet.has(id));
  const removedCategoryIds = oldCategoryIds.filter((id) => !newSet.has(id));

  if (addedCategoryIds.length === 0 && removedCategoryIds.length === 0) return;

  const affectedBankAccountIds = new Set<string>();

  await cascadePaginatedBatch<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "counterpartyId", operator: "==", value: counterpartyId },
    ],
    onPage: ({ items, batch }) => {
      const changed = applyCategoryIdsDiffToTransactions({
        counterpartyId,
        addedCategoryIds,
        removedCategoryIds,
        transactions: items,
      });
      for (const tx of changed) {
        affectedBankAccountIds.add(tx.bankAccountId);
        batch.update(
          createDocRef({ collection: "transactions", id: tx.id }),
          { categoryIds: tx.categoryIds }
        );
      }
    },
  });

  if (affectedBankAccountIds.size === 0) return;

  // Rebuild reports for affected bank accounts — fan-out tracked by deferred observation #12.
  await Promise.all(
    [...affectedBankAccountIds].map((bankAccountId) =>
      rebuildReport({
        userId,
        bankAccountId,
        options: { toastOptions: undefined },
      })
    )
  );
};
