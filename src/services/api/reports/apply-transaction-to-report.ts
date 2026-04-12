import type { ITransaction } from "~/@schemas/models/transaction";
import type { IMonthlyEntry, IReportBase } from "~/@schemas/models/report";
import { formatMonthKey } from "~/helpers/formatMonthKey";
import { roundCurrency } from "~/helpers/roundCurrency";

type IProps = {
  report: IReportBase;
  transaction: ITransaction;
  direction: 1 | -1;
};

const applyCurrencyDelta = ({
  map,
  key,
  amount,
  direction,
}: {
  map: Record<string, number>;
  key: string;
  amount: number;
  direction: 1 | -1;
}) => {
  const current = map[key] ?? 0;
  const next = roundCurrency({ value: Math.max(0, current + amount * direction) });
  if (next === 0) delete map[key];
  else map[key] = next;
};

const applyCountDelta = ({
  map,
  key,
  direction,
}: {
  map: Record<string, number>;
  key: string;
  direction: 1 | -1;
}) => {
  const next = Math.max(0, (map[key] ?? 0) + direction);
  if (next === 0) delete map[key];
  else map[key] = next;
};

const applyNestedCurrencyDelta = ({
  outer,
  outerKey,
  innerKey,
  amount,
  direction,
}: {
  outer: Record<string, Record<string, number>>;
  outerKey: string;
  innerKey: string;
  amount: number;
  direction: 1 | -1;
}) => {
  const inner = { ...(outer[outerKey] ?? {}) };
  const current = inner[innerKey] ?? 0;
  const next = roundCurrency({ value: Math.max(0, current + amount * direction) });
  if (next === 0) delete inner[innerKey];
  else inner[innerKey] = next;

  if (Object.keys(inner).length === 0) delete outer[outerKey];
  else outer[outerKey] = inner;
};

const createEmptyMonthlyEntry = (): IMonthlyEntry => ({
  income: 0,
  expenses: 0,
  transactionCount: 0,
  expensesByCategory: {},
  depositsByCategory: {},
  expensesByCounterparty: {},
  depositsByCounterparty: {},
  expensesByCategoryAndCounterparty: {},
  depositsByCategoryAndCounterparty: {},
  expensesByCategoryCount: {},
  depositsByCategoryCount: {},
  expensesByCounterpartyCount: {},
  depositsByCounterpartyCount: {},
});

export const applyTransactionToReport = ({ report, transaction, direction }: IProps): IReportBase => {
  const amount = Math.abs(transaction.amount);
  const monthKey = formatMonthKey({ timestamp: transaction.date });
  const isDeposit = transaction.type === "deposit";

  const updated = { ...report };

  if (isDeposit) {
    updated.totalIncome = roundCurrency({ value: Math.max(0, updated.totalIncome + amount * direction) });
  } else {
    updated.totalExpenses = roundCurrency({ value: Math.max(0, updated.totalExpenses + amount * direction) });
  }

  updated.transactionCount = Math.max(0, updated.transactionCount + direction);

  const rootCategoryMap = isDeposit
    ? { ...updated.depositsByCategory }
    : { ...updated.expensesByCategory };

  for (const categoryId of transaction.categoryIds) {
    applyCurrencyDelta({ map: rootCategoryMap, key: categoryId, amount, direction });
  }

  if (isDeposit) updated.depositsByCategory = rootCategoryMap;
  else updated.expensesByCategory = rootCategoryMap;

  if (transaction.counterpartyId) {
    const rootCounterpartyMap = isDeposit
      ? { ...updated.depositsByCounterparty }
      : { ...updated.expensesByCounterparty };

    applyCurrencyDelta({
      map: rootCounterpartyMap,
      key: transaction.counterpartyId,
      amount,
      direction,
    });

    if (isDeposit) updated.depositsByCounterparty = rootCounterpartyMap;
    else updated.expensesByCounterparty = rootCounterpartyMap;
  }

  const monthlyBreakdown = { ...updated.monthlyBreakdown };
  const existing = monthlyBreakdown[monthKey];
  const monthEntry: IMonthlyEntry = existing
    ? { ...createEmptyMonthlyEntry(), ...existing }
    : createEmptyMonthlyEntry();

  if (isDeposit) {
    monthEntry.income = roundCurrency({ value: Math.max(0, monthEntry.income + amount * direction) });
  } else {
    monthEntry.expenses = roundCurrency({ value: Math.max(0, monthEntry.expenses + amount * direction) });
  }

  monthEntry.transactionCount = Math.max(0, monthEntry.transactionCount + direction);

  const monthCategoryMap = isDeposit
    ? { ...monthEntry.depositsByCategory }
    : { ...monthEntry.expensesByCategory };
  const monthCategoryCountMap = isDeposit
    ? { ...monthEntry.depositsByCategoryCount }
    : { ...monthEntry.expensesByCategoryCount };

  for (const categoryId of transaction.categoryIds) {
    applyCurrencyDelta({ map: monthCategoryMap, key: categoryId, amount, direction });
    applyCountDelta({ map: monthCategoryCountMap, key: categoryId, direction });
  }

  if (isDeposit) {
    monthEntry.depositsByCategory = monthCategoryMap;
    monthEntry.depositsByCategoryCount = monthCategoryCountMap;
  } else {
    monthEntry.expensesByCategory = monthCategoryMap;
    monthEntry.expensesByCategoryCount = monthCategoryCountMap;
  }

  if (transaction.counterpartyId) {
    const counterpartyId = transaction.counterpartyId;

    const monthCounterpartyMap = isDeposit
      ? { ...monthEntry.depositsByCounterparty }
      : { ...monthEntry.expensesByCounterparty };
    const monthCounterpartyCountMap = isDeposit
      ? { ...monthEntry.depositsByCounterpartyCount }
      : { ...monthEntry.expensesByCounterpartyCount };

    applyCurrencyDelta({
      map: monthCounterpartyMap,
      key: counterpartyId,
      amount,
      direction,
    });
    applyCountDelta({
      map: monthCounterpartyCountMap,
      key: counterpartyId,
      direction,
    });

    if (isDeposit) {
      monthEntry.depositsByCounterparty = monthCounterpartyMap;
      monthEntry.depositsByCounterpartyCount = monthCounterpartyCountMap;
    } else {
      monthEntry.expensesByCounterparty = monthCounterpartyMap;
      monthEntry.expensesByCounterpartyCount = monthCounterpartyCountMap;
    }

    // Cross-ref map: one nested entry per category the transaction carries.
    // A multi-category transaction ("Mercado" + "Lazer") increments the full
    // amount under both outer keys — consistent with the 1D map design.
    const crossRef = isDeposit
      ? { ...monthEntry.depositsByCategoryAndCounterparty }
      : { ...monthEntry.expensesByCategoryAndCounterparty };

    for (const categoryId of transaction.categoryIds) {
      applyNestedCurrencyDelta({
        outer: crossRef,
        outerKey: categoryId,
        innerKey: counterpartyId,
        amount,
        direction,
      });
    }

    if (isDeposit) monthEntry.depositsByCategoryAndCounterparty = crossRef;
    else monthEntry.expensesByCategoryAndCounterparty = crossRef;
  }

  monthlyBreakdown[monthKey] = monthEntry;
  updated.monthlyBreakdown = monthlyBreakdown;

  return updated;
};
