import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICreditor } from "~/@schemas/models/creditor";

export const groupByCreditor = (
  transactions: ITransaction[],
  creditors: ICreditor[]
) => {
  const grouped: Record<string, { name: string; amount: number }> = {};

  transactions.forEach((transaction) => {
    if (transaction.creditorId) {
      const creditor = creditors.find((c) => c.id === transaction.creditorId);
      const creditorName = creditor?.name || "Unknown";

      if (!grouped[transaction.creditorId]) {
        grouped[transaction.creditorId] = {
          name: creditorName,
          amount: 0,
        };
      }

      grouped[transaction.creditorId]!.amount += Math.abs(transaction.amount);
    }
  });

  return Object.entries(grouped)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.amount - a.amount);
};
