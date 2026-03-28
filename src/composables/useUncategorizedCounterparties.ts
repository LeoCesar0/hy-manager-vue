import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ITransaction } from "~/@schemas/models/transaction";
import { getUncategorizedCounterparties } from "~/services/api/counterparties/get-uncategorized-counterparties";
import { getTransactions } from "~/services/api/transactions/get-transactions";

type CounterpartyStats = {
  depositTotal: number;
  depositCount: number;
  expenseTotal: number;
  expenseCount: number;
  lastTransactionDate: Date | null;
};

export type UncategorizedCounterpartyItem = {
  counterparty: ICounterparty;
  stats: CounterpartyStats;
};

const emptyStats: CounterpartyStats = {
  depositTotal: 0,
  depositCount: 0,
  expenseTotal: 0,
  expenseCount: 0,
  lastTransactionDate: null,
};

export const useUncategorizedCounterparties = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  const uncategorizedCounterparties = ref<ICounterparty[]>([]);
  const transactions = ref<ITransaction[]>([]);
  const isLoading = ref(false);

  const items = computed<UncategorizedCounterpartyItem[]>(() => {
    const statsByCounterparty = new Map<string, CounterpartyStats>();

    for (const tx of transactions.value) {
      if (!tx.counterpartyId) continue;

      const existing = statsByCounterparty.get(tx.counterpartyId) ?? { ...emptyStats };
      const txDate = tx.date instanceof Date ? tx.date : (tx.date as { toDate(): Date }).toDate();

      if (tx.type === "deposit") {
        existing.depositTotal += Math.abs(tx.amount);
        existing.depositCount++;
      } else {
        existing.expenseTotal += Math.abs(tx.amount);
        existing.expenseCount++;
      }

      if (!existing.lastTransactionDate || txDate > existing.lastTransactionDate) {
        existing.lastTransactionDate = txDate;
      }

      statsByCounterparty.set(tx.counterpartyId, existing);
    }

    return uncategorizedCounterparties.value
      .map((counterparty) => ({
        counterparty,
        stats: statsByCounterparty.get(counterparty.id) ?? { ...emptyStats },
      }))
      .sort((a, b) => {
        const totalA = a.stats.expenseTotal + a.stats.depositTotal;
        const totalB = b.stats.expenseTotal + b.stats.depositTotal;
        return totalB - totalA;
      });
  });

  const count = computed(() => uncategorizedCounterparties.value.length);

  const loadData = async () => {
    if (!currentUser.value) return;

    isLoading.value = true;
    const silentOptions = { toastOptions: undefined } as const;

    try {
      const [counterpartiesRes, transactionsRes] = await Promise.all([
        getUncategorizedCounterparties({
          userId: currentUser.value.id,
          options: silentOptions,
        }),
        getTransactions({
          userId: currentUser.value.id,
          options: silentOptions,
        }),
      ]);

      if (counterpartiesRes.data) {
        uncategorizedCounterparties.value = counterpartiesRes.data;
      }
      if (transactionsRes.data) {
        transactions.value = transactionsRes.data;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const removeCounterparty = (counterpartyId: string) => {
    uncategorizedCounterparties.value = uncategorizedCounterparties.value.filter(
      (c) => c.id !== counterpartyId
    );
  };

  return {
    items,
    count,
    isLoading,
    loadData,
    removeCounterparty,
  };
};
