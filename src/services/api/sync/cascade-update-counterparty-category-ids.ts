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
  /**
   * When false, propagate the categoryIds diff to transactions but skip the
   * report rebuild, returning the affected bank-account ids so a batch caller
   * can dedupe and rebuild each report once. Defaults to true (rebuild inline)
   * for the single-counterparty path.
   */
  rebuildReports?: boolean;
};

/** Returns the ids of the bank accounts whose transactions were touched. */
export const cascadeUpdateCounterpartyCategoryIds = async ({
  counterpartyId,
  oldCategoryIds,
  newCategoryIds,
  userId,
  rebuildReports = true,
}: IProps): Promise<string[]> => {
  const oldSet = new Set(oldCategoryIds);
  const newSet = new Set(newCategoryIds);

  const addedCategoryIds = newCategoryIds.filter((id) => !oldSet.has(id));
  const removedCategoryIds = oldCategoryIds.filter((id) => !newSet.has(id));

  if (addedCategoryIds.length === 0 && removedCategoryIds.length === 0) return [];

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

  const affectedIds = [...affectedBankAccountIds];
  if (affectedIds.length === 0) return [];

  if (rebuildReports) {
    // Rebuild reports for affected bank accounts — fan-out tracked by deferred
    // observation #12. Sequential (not Promise.all) so a counterparty spanning
    // several accounts doesn't fire concurrent full rebuilds on the main thread.
    for (const bankAccountId of affectedIds) {
      await rebuildReport({
        userId,
        bankAccountId,
        options: { toastOptions: undefined },
      });
    }
  }

  return affectedIds;
};
