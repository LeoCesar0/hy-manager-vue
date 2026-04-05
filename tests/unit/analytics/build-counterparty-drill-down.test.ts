import { describe, it, expect } from "vitest";
import { makeCounterparty, makeMonthlyEntry, makeReport } from "../../helpers";
import { buildCounterpartyDrillDown } from "~/services/analytics/build-counterparty-drill-down";
import type { IReport } from "~/@schemas/models/report";

const asReport = (r: ReturnType<typeof makeReport>): IReport => r as IReport;

describe("buildCounterpartyDrillDown", () => {
  const counterparties = [
    makeCounterparty({ id: "cp-market", name: "Supermarket" }),
    makeCounterparty({ id: "cp-employer", name: "Employer" }),
  ];

  const report = asReport(
    makeReport({
      totalIncome: 2000,
      totalExpenses: 800,
      expensesByCounterparty: { "cp-market": 600, "cp-employer": 0 },
      depositsByCounterparty: { "cp-market": 0, "cp-employer": 1500 },
      monthlyBreakdown: {
        "2025-01": makeMonthlyEntry({
          income: 1000,
          expenses: 400,
          expensesByCounterparty: { "cp-market": 300 },
          depositsByCounterparty: { "cp-employer": 750 },
        }),
        "2025-02": makeMonthlyEntry({
          income: 1000,
          expenses: 400,
          expensesByCounterparty: { "cp-market": 300 },
          depositsByCounterparty: { "cp-employer": 750 },
        }),
      },
    })
  );

  it("computes monthly data for the selected counterparty across months", () => {
    const result = buildCounterpartyDrillDown({
      report,
      counterparties,
      selectedCounterpartyId: "cp-market",
      monthKeys: ["2025-01", "2025-02"],
    });

    expect(result.monthlyData).toHaveLength(2);
    expect(result.monthlyData[0]).toEqual({
      label: "01/2025",
      expenses: 300,
      deposits: 0,
      total: 300,
    });
  });

  it("computes percentOfExpenses correctly", () => {
    const result = buildCounterpartyDrillDown({
      report,
      counterparties,
      selectedCounterpartyId: "cp-market",
      monthKeys: ["2025-01", "2025-02"],
    });
    // cp-market expense = 600, total all expenses = 800 → 75%
    expect(result.percentOfExpenses).toBe(75);
  });

  it("computes percentOfDeposits correctly", () => {
    const result = buildCounterpartyDrillDown({
      report,
      counterparties,
      selectedCounterpartyId: "cp-employer",
      monthKeys: ["2025-01", "2025-02"],
    });
    // cp-employer deposit = 1500, total all income = 2000 → 75%
    expect(result.percentOfDeposits).toBe(75);
  });

  it("returns 0 for percentages when totals are zero", () => {
    const zeroReport = asReport(
      makeReport({
        totalIncome: 0,
        totalExpenses: 0,
        expensesByCounterparty: {},
        depositsByCounterparty: {},
        monthlyBreakdown: {},
      })
    );

    const result = buildCounterpartyDrillDown({
      report: zeroReport,
      counterparties,
      selectedCounterpartyId: "cp-market",
      monthKeys: [],
    });

    expect(result.percentOfExpenses).toBe(0);
    expect(result.percentOfDeposits).toBe(0);
    expect(result.monthlyData).toEqual([]);
  });

  it("returns undefined item when ID doesn't match any known counterparty", () => {
    const result = buildCounterpartyDrillDown({
      report,
      counterparties,
      selectedCounterpartyId: "unknown-cp",
      monthKeys: ["2025-01"],
    });

    expect(result.item).toBeUndefined();
    expect(result.monthlyData).toHaveLength(1);
  });

  it("sorts monthKeys chronologically regardless of input order", () => {
    const result = buildCounterpartyDrillDown({
      report,
      counterparties,
      selectedCounterpartyId: "cp-market",
      monthKeys: ["2025-02", "2025-01"],
    });

    expect(result.monthlyData[0]?.label).toBe("01/2025");
    expect(result.monthlyData[1]?.label).toBe("02/2025");
  });
});
