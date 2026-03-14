import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { roundCurrency } from "~/helpers/roundCurrency";

export const groupByCounterparty = (
  transactions: ITransaction[],
  counterparties: ICounterparty[]
) => {
  const counterpartyMap = new Map(counterparties.map((c) => [c.id, c]));
  const grouped: Record<string, { name: string; amount: number }> = {};

  transactions.forEach((transaction) => {
    if (transaction.counterpartyId) {
      const counterparty = counterpartyMap.get(transaction.counterpartyId);
      const counterpartyName = counterparty?.name || "Unknown";

      if (!grouped[transaction.counterpartyId]) {
        grouped[transaction.counterpartyId] = {
          name: counterpartyName,
          amount: 0,
        };
      }

      grouped[transaction.counterpartyId]!.amount = roundCurrency({ value: grouped[transaction.counterpartyId]!.amount + Math.abs(transaction.amount) });
    }
  });

  return Object.entries(grouped)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.amount - a.amount);
};
