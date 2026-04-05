import type { IReport } from "~/@schemas/models/report";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IItemDrillDown } from "./build-category-drill-down";

type IProps = {
  report: IReport;
  counterparties: ICounterparty[];
  selectedCounterpartyId: string;
  monthKeys: string[];
};

// Mirror of buildCategoryDrillDown but sourcing from the counterparty maps on
// the report. Returns the same shape so the UI drill-down component doesn't
// need to branch on the item kind.
// Counterparties don't have a color field — the item.color comes back
// undefined, which is fine for the current UI.
export const buildCounterpartyDrillDown = ({
  report,
  counterparties,
  selectedCounterpartyId,
  monthKeys,
}: IProps): IItemDrillDown => {
  const sorted = [...monthKeys].sort();
  const cp = counterparties.find((c) => c.id === selectedCounterpartyId);

  const monthlyData = sorted.map((key) => {
    const entry = report.monthlyBreakdown[key];
    const [year, month] = key.split("-");
    const expenseAmount =
      entry?.expensesByCounterparty?.[selectedCounterpartyId] ?? 0;
    const depositAmount =
      entry?.depositsByCounterparty?.[selectedCounterpartyId] ?? 0;
    return {
      label: `${month}/${year}`,
      expenses: expenseAmount,
      deposits: depositAmount,
      total: expenseAmount + depositAmount,
    };
  });

  const totalExpense = report.expensesByCounterparty[selectedCounterpartyId] ?? 0;
  const totalDeposit = report.depositsByCounterparty[selectedCounterpartyId] ?? 0;
  const totalAllExpenses = report.totalExpenses ?? 0;
  const totalAllDeposits = report.totalIncome ?? 0;

  const percentOfExpenses =
    totalAllExpenses > 0 ? (totalExpense / totalAllExpenses) * 100 : 0;
  const percentOfDeposits =
    totalAllDeposits > 0 ? (totalDeposit / totalAllDeposits) * 100 : 0;

  return {
    item: cp ? { id: cp.id, name: cp.name, color: null } : undefined,
    monthlyData,
    totalExpense,
    totalDeposit,
    percentOfExpenses,
    percentOfDeposits,
  };
};
