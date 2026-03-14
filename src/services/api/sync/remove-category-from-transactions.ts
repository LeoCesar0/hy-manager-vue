import type { ITransaction } from "~/@schemas/models/transaction";

type IProps = {
  categoryId: string;
  transactions: ITransaction[];
};

export const removeCategoryFromTransactions = ({ categoryId, transactions }: IProps): ITransaction[] => {
  return transactions.reduce<ITransaction[]>((changed, transaction) => {
    if (!transaction.categoryIds.includes(categoryId)) return changed;

    changed.push({
      ...transaction,
      categoryIds: transaction.categoryIds.filter((id) => id !== categoryId),
    });

    return changed;
  }, []);
};
