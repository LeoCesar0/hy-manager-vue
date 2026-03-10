import type { ITransaction } from "~/@schemas/models/transaction";
import type { IReportBase } from "~/@schemas/models/report";
import { getOrCreateReport } from "./get-or-create-report";
import { saveReport } from "./save-report";
import { applyTransactionToReport } from "./apply-transaction-to-report";

type IProps = {
  userId: string;
  bankAccountId: string;
  newTransactions: ITransaction[];
};

export const updateReportBulk = async ({ userId, bankAccountId, newTransactions }: IProps) => {
  console.log(`------------- 🟢 START UPDATE REPORT BULK -------------`);
  console.log(`❗ userId -->`, userId);
  console.log(`❗ bankAccountId -->`, bankAccountId);
  console.log(`❗ newTransactions.length -->`, newTransactions.length);
  try {
    if (newTransactions.length === 0) return;

    const reportResult = await getOrCreateReport({
      userId,
      bankAccountId,
      options: { toastOptions: undefined },
    });
    console.log(`❗ reportResult -->`, reportResult);

    if (!reportResult.data) return;

    const initialReport: IReportBase = reportResult.data;

    const updatedReport = newTransactions.reduce(
      (report, transaction) => applyTransactionToReport({ report, transaction, direction: 1 }),
      initialReport
    );

    await saveReport({
      bankAccountId,
      data: updatedReport,
      options: { toastOptions: undefined },
    });
  } catch (error) {
    console.error("[updateReportBulk] Best-effort report update failed:", error);
    throw error
  }
};
