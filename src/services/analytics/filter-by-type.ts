import type { ITransaction, ITransactionType } from "~/@schemas/models/transaction";

type IProps = {
  transactions: ITransaction[];
  type: ITransactionType;
};

export const filterByType = ({ transactions, type }: IProps): ITransaction[] => {
  return transactions.filter((transaction) => transaction.type === type);
};
