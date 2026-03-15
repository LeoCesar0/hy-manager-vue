import type { ITransaction } from "~/@schemas/models/transaction";
import type { IReportBase } from "~/@schemas/models/report";
import { formatMonthKey } from "~/helpers/formatMonthKey";
import { roundCurrency } from "~/helpers/roundCurrency";

type IProps = {
  report: IReportBase;
  transaction: ITransaction;
  direction: 1 | -1;
};

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

  const categoryMap = isDeposit
    ? { ...updated.depositsByCategory }
    : { ...updated.expensesByCategory };

  for (const categoryId of transaction.categoryIds) {
    const current = categoryMap[categoryId] ?? 0;
    const newValue = roundCurrency({ value: Math.max(0, current + amount * direction) });
    if (newValue === 0) {
      delete categoryMap[categoryId];
    } else {
      categoryMap[categoryId] = newValue;
    }
  }

  if (isDeposit) {
    updated.depositsByCategory = categoryMap;
  } else {
    updated.expensesByCategory = categoryMap;
  }

  if (transaction.counterpartyId) {
    const counterpartyMap = isDeposit
      ? { ...updated.depositsByCounterparty }
      : { ...updated.expensesByCounterparty };

    const current = counterpartyMap[transaction.counterpartyId] ?? 0;
    const newValue = roundCurrency({ value: Math.max(0, current + amount * direction) });
    if (newValue === 0) {
      delete counterpartyMap[transaction.counterpartyId];
    } else {
      counterpartyMap[transaction.counterpartyId] = newValue;
    }

    if (isDeposit) {
      updated.depositsByCounterparty = counterpartyMap;
    } else {
      updated.expensesByCounterparty = counterpartyMap;
    }
  }

  const monthlyBreakdown = { ...updated.monthlyBreakdown };
  const monthEntry = monthlyBreakdown[monthKey] ?? {
    income: 0,
    expenses: 0,
    expensesByCategory: {},
    depositsByCategory: {},
    expensesByCounterparty: {},
    depositsByCounterparty: {},
  };

  if (isDeposit) {
    monthEntry.income = roundCurrency({ value: Math.max(0, monthEntry.income + amount * direction) });
  } else {
    monthEntry.expenses = roundCurrency({ value: Math.max(0, monthEntry.expenses + amount * direction) });
  }

  const monthCategoryMap = isDeposit
    ? { ...(monthEntry.depositsByCategory ?? {}) }
    : { ...(monthEntry.expensesByCategory ?? {}) };

  for (const categoryId of transaction.categoryIds) {
    const current = monthCategoryMap[categoryId] ?? 0;
    const newValue = roundCurrency({ value: Math.max(0, current + amount * direction) });
    if (newValue === 0) {
      delete monthCategoryMap[categoryId];
    } else {
      monthCategoryMap[categoryId] = newValue;
    }
  }

  if (isDeposit) {
    monthEntry.depositsByCategory = monthCategoryMap;
  } else {
    monthEntry.expensesByCategory = monthCategoryMap;
  }

  if (transaction.counterpartyId) {
    const monthCounterpartyMap = isDeposit
      ? { ...(monthEntry.depositsByCounterparty ?? {}) }
      : { ...(monthEntry.expensesByCounterparty ?? {}) };

    const current = monthCounterpartyMap[transaction.counterpartyId] ?? 0;
    const newValue = roundCurrency({ value: Math.max(0, current + amount * direction) });
    if (newValue === 0) {
      delete monthCounterpartyMap[transaction.counterpartyId];
    } else {
      monthCounterpartyMap[transaction.counterpartyId] = newValue;
    }

    if (isDeposit) {
      monthEntry.depositsByCounterparty = monthCounterpartyMap;
    } else {
      monthEntry.expensesByCounterparty = monthCounterpartyMap;
    }
  }

  monthlyBreakdown[monthKey] = monthEntry;
  updated.monthlyBreakdown = monthlyBreakdown;

  return updated;
};
