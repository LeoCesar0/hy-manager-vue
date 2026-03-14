import type { ITransaction } from "~/@schemas/models/transaction";

type IProps = {
  counterpartyId: string;
  transactions: ITransaction[];
};

export const removeCounterpartyFromTransactions = ({ counterpartyId, transactions }: IProps): ITransaction[] => {
  return transactions.reduce<ITransaction[]>((changed, transaction) => {
    if (transaction.counterpartyId !== counterpartyId) return changed;

    changed.push({
      ...transaction,
      counterpartyId: null,
    });

    return changed;
  }, []);
};
