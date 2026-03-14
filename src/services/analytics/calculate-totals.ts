import type { ITransaction } from "~/@schemas/models/transaction";
import { roundCurrency } from "~/helpers/roundCurrency";

export const calculateTotals = (transactions: ITransaction[]) => {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "deposit") {
      totalIncome += Math.abs(transaction.amount);
    } else {
      totalExpenses += Math.abs(transaction.amount);
    }
  });

  return {
    income: roundCurrency({ value: totalIncome }),
    expenses: roundCurrency({ value: totalExpenses }),
    balance: roundCurrency({ value: totalIncome - totalExpenses }),
  };
};
