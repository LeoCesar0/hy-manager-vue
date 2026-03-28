import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ITransaction } from "~/@schemas/models/transaction";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";
import { getTransactions } from "~/services/api/transactions/get-transactions";

type CounterpartyStats = {
  depositTotal: number;
  depositCount: number;
  expenseTotal: number;
  expenseCount: number;
  lastTransactionDate: Date | null;
};

export type CounterpartyCategorizationItem = {
  counterparty: ICounterparty;
  stats: CounterpartyStats;
  transactions: ITransaction[];
};

const emptyStats: CounterpartyStats = {
  depositTotal: 0,
  depositCount: 0,
  expenseTotal: 0,
  expenseCount: 0,
  lastTransactionDate: null,
};

const toDate = (date: Date | { toDate(): Date }): Date => {
  return date instanceof Date ? date : date.toDate();
};

const buildItems = (
  counterparties: ICounterparty[],
  transactions: ITransaction[]
): CounterpartyCategorizationItem[] => {
  const statsByCounterparty = new Map<string, CounterpartyStats>();
  const txByCounterparty = new Map<string, ITransaction[]>();

  for (const tx of transactions) {
    if (!tx.counterpartyId) continue;

    const existing = statsByCounterparty.get(tx.counterpartyId) ?? { ...emptyStats };
    const txDate = toDate(tx.date);

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

    const txList = txByCounterparty.get(tx.counterpartyId) ?? [];
    txList.push(tx);
    txByCounterparty.set(tx.counterpartyId, txList);
  }

  return counterparties.map((counterparty) => {
    const counterpartyTxs = txByCounterparty.get(counterparty.id) ?? [];
    counterpartyTxs.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());

    return {
      counterparty,
      stats: statsByCounterparty.get(counterparty.id) ?? { ...emptyStats },
      transactions: counterpartyTxs,
    };
  });
};

export const useCounterpartiesCategorization = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  const allCounterparties = ref<ICounterparty[]>([]);
  const allTransactions = ref<ITransaction[]>([]);
  const isLoading = ref(false);

  const uncategorizedList = computed(() =>
    allCounterparties.value.filter((c) => !c.categoryIds || c.categoryIds.length === 0)
  );

  const categorizedList = computed(() =>
    allCounterparties.value.filter((c) => c.categoryIds && c.categoryIds.length > 0)
  );

  const uncategorizedItems = computed(() =>
    buildItems(uncategorizedList.value, allTransactions.value).sort((a, b) => {
      const totalA = a.stats.expenseTotal + a.stats.depositTotal;
      const totalB = b.stats.expenseTotal + b.stats.depositTotal;
      return totalB - totalA;
    })
  );

  const categorizedItems = computed(() =>
    buildItems(categorizedList.value, allTransactions.value).sort((a, b) =>
      a.counterparty.name.localeCompare(b.counterparty.name)
    )
  );

  const uncategorizedCount = computed(() => uncategorizedList.value.length);
  const categorizedCount = computed(() => categorizedList.value.length);

  const loadData = async () => {
    if (!currentUser.value) return;

    isLoading.value = true;
    const silentOptions = { toastOptions: undefined } as const;

    try {
      const [counterpartiesRes, transactionsRes] = await Promise.all([
        getCounterparties({
          userId: currentUser.value.id,
          options: silentOptions,
        }),
        getTransactions({
          userId: currentUser.value.id,
          options: silentOptions,
        }),
      ]);

      if (counterpartiesRes.data) {
        allCounterparties.value = counterpartiesRes.data;
      }
      if (transactionsRes.data) {
        allTransactions.value = transactionsRes.data;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const updateLocalCounterparty = (counterpartyId: string, categoryIds: string[]) => {
    allCounterparties.value = allCounterparties.value.map((c) =>
      c.id === counterpartyId ? { ...c, categoryIds } : c
    );
  };

  return {
    uncategorizedItems,
    categorizedItems,
    uncategorizedCount,
    categorizedCount,
    isLoading,
    loadData,
    updateLocalCounterparty,
  };
};
