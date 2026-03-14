import type { ITransaction } from "~/@schemas/models/transaction";

type IProps = {
  counterpartyId: string;
  addedCategoryIds: string[];
  removedCategoryIds: string[];
  transactions: ITransaction[];
};

export const applyCategoryIdsDiffToTransactions = ({
  counterpartyId,
  addedCategoryIds,
  removedCategoryIds,
  transactions,
}: IProps): ITransaction[] => {
  const removedSet = new Set(removedCategoryIds);

  return transactions.reduce<ITransaction[]>((changed, transaction) => {
    if (transaction.counterpartyId !== counterpartyId) return changed;

    const filtered = transaction.categoryIds.filter((id) => !removedSet.has(id));
    const existingSet = new Set(filtered);
    const added = addedCategoryIds.filter((id) => !existingSet.has(id));
    const newCategoryIds = [...filtered, ...added];

    const hasChanged =
      newCategoryIds.length !== transaction.categoryIds.length ||
      newCategoryIds.some((id, i) => id !== transaction.categoryIds[i]);

    if (!hasChanged) return changed;

    changed.push({
      ...transaction,
      categoryIds: newCategoryIds,
    });

    return changed;
  }, []);
};
