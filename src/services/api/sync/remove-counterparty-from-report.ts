import type { IReportBase } from "~/@schemas/models/report";

type IProps = {
  counterpartyId: string;
  report: IReportBase;
};

export const removeCounterpartyFromReport = ({ counterpartyId, report }: IProps): IReportBase => {
  const { [counterpartyId]: _expense, ...expensesByCounterparty } = report.expensesByCounterparty;
  const { [counterpartyId]: _deposit, ...depositsByCounterparty } = report.depositsByCounterparty;

  return {
    ...report,
    expensesByCounterparty,
    depositsByCounterparty,
  };
};
