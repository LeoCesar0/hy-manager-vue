import type { IReportBase } from "~/@schemas/models/report";

type IProps = {
  categoryId: string;
  report: IReportBase;
};

export const removeCategoryFromReport = ({ categoryId, report }: IProps): IReportBase => {
  const { [categoryId]: _expense, ...expensesByCategory } = report.expensesByCategory;
  const { [categoryId]: _deposit, ...depositsByCategory } = report.depositsByCategory;

  return {
    ...report,
    expensesByCategory,
    depositsByCategory,
  };
};
