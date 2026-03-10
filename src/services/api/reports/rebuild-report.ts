import type { IReport, IReportBase } from "~/@schemas/models/report";
import type { IAPIRequestCommon } from "../@types";
import { getTransactions } from "../transactions/get-transactions";
import { getOrCreateReport } from "./get-or-create-report";
import { saveReport } from "./save-report";
import { applyTransactionToReport } from "./apply-transaction-to-report";

type IProps = {
  userId: string;
  bankAccountId: string;
} & IAPIRequestCommon<IReport>;

export const rebuildReport = async ({ userId, bankAccountId, options }: IProps) => {
  const reportResult = await getOrCreateReport({
    userId,
    bankAccountId,
    options: { toastOptions: undefined },
  });

  if (!reportResult.data) return reportResult;

  const transactionsResult = await getTransactions({
    userId,
    bankAccountId,
    options: { toastOptions: undefined },
  });

  if (!transactionsResult.data) return reportResult;

  const emptyBase: IReportBase = {
    userId,
    bankAccountId,
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0,
    expensesByCategory: {},
    depositsByCategory: {},
    expensesByCounterparty: {},
    depositsByCounterparty: {},
    monthlyBreakdown: {},
  };

  const rebuilt = transactionsResult.data.reduce(
    (report, transaction) => applyTransactionToReport({ report, transaction, direction: 1 }),
    emptyBase
  );

  return saveReport({
    bankAccountId,
    data: rebuilt,
    options,
  });
};
