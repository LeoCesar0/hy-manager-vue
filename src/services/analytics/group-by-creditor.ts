import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";

export const groupByCreditor = (
  transactions: ITransaction[],
  creditors: ICounterparty[]
) => {
  const grouped: Record<string, { name: string; amount: number }> = {};

  transactions.forEach((transaction) => {
    if (transaction.counterpartyId) {
      const creditor = creditors.find((c) => c.id === transaction.counterpartyId);
      const creditorName = creditor?.name || "Unknown";

      if (!grouped[transaction.counterpartyId]) {
        grouped[transaction.counterpartyId] = {
          name: creditorName,
          amount: 0,
        };
      }

      grouped[transaction.counterpartyId]!.amount += Math.abs(transaction.amount);
    }
  });

  return Object.entries(grouped)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.amount - a.amount);
};
