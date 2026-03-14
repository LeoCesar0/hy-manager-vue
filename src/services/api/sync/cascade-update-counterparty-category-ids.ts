import type { ITransaction } from "~/@schemas/models/transaction";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
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

  const transactions = await firebaseList<ITransaction>({
    collection: "transactions",
    filters: [
      { field: "userId", operator: "==", value: userId },
      { field: "counterpartyId", operator: "==", value: counterpartyId },
    ],
  });

  const changedTransactions = applyCategoryIdsDiffToTransactions({
    counterpartyId,
    addedCategoryIds,
    removedCategoryIds,
    transactions,
  });

  if (changedTransactions.length === 0) return;

  await firebaseUpdateMany({
    collection: "transactions",
    items: changedTransactions.map((t) => ({
      id: t.id,
      data: { categoryIds: t.categoryIds },
    })),
  });

  // Rebuild reports for affected bank accounts
  // Note: Not batched — rebuildReport goes through handleAppRequest/saveReport pipeline with its own reads+writes
  const bankAccountIds = [...new Set(changedTransactions.map((t) => t.bankAccountId))];

  await Promise.all(
    bankAccountIds.map((bankAccountId) =>
      rebuildReport({
        userId,
        bankAccountId,
        options: { toastOptions: undefined },
      })
    )
  );
};
