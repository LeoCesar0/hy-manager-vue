import type { ITransaction } from "~/@schemas/models/transaction";
import type { IReportBase } from "~/@schemas/models/report";
import { getOrCreateReport } from "./get-or-create-report";
import { saveReport } from "./save-report";
import { applyTransactionToReport } from "./apply-transaction-to-report";

type IProps = {
  userId: string;
  bankAccountId: string;
  oldTransaction?: ITransaction;
  newTransaction?: ITransaction;
};

export const updateReport = async ({ userId, bankAccountId, oldTransaction, newTransaction }: IProps) => {
  try {
    const reportResult = await getOrCreateReport({
      userId,
      bankAccountId,
      options: { toastOptions: undefined },
    });

    if (!reportResult.data) return;

    let reportBase: IReportBase = reportResult.data;

    if (oldTransaction) {
      reportBase = applyTransactionToReport({ report: reportBase, transaction: oldTransaction, direction: -1 });
    }

    if (newTransaction) {
      reportBase = applyTransactionToReport({ report: reportBase, transaction: newTransaction, direction: 1 });
    }

    await saveReport({
      bankAccountId,
      data: reportBase,
      options: { toastOptions: undefined },
    });
  } catch (error) {
    console.error("[updateReport] Best-effort report update failed:", error);
  }
};
