import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeReport, makeCategory, makeMonthlyEntry } from "../../helpers";
import { calculateReportInsights } from "~/services/analytics/calculate-report-insights";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

const currentYear = new Date().getFullYear().toString();

describe("calculateReportInsights", () => {
  it("calculates savings rate correctly", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({ income: 5000, expenses: 3000 }),
          "2024-02": makeMonthlyEntry({ income: 5000, expenses: 2000 }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01", "2024-02"],
      categories: [],
    });

    // (10000 - 5000) / 10000 * 100 = 50%
    expect(result.savingsRate).toBe(50);
  });

  it("returns null savings rate when no income", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({ income: 0, expenses: 1000 }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01"],
      categories: [],
    });

    expect(result.savingsRate).toBeNull();
  });

  it("handles negative savings rate (spending more than earning)", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({ income: 3000, expenses: 5000 }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01"],
      categories: [],
    });

    // (3000 - 5000) / 3000 * 100 = -66.67
    expect(result.savingsRate).toBeCloseTo(-66.67, 1);
  });

  it("identifies biggest spending increase by category", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-transport", name: "Transporte" }),
    ];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 300, "cat-transport": 100 },
          }),
          "2024-03": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 400, "cat-transport": 500 },
          }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01", "2024-03"],
      categories,
    });

    expect(result.biggestIncrease).not.toBeNull();
    expect(result.biggestIncrease!.name).toBe("Transporte");
    expect(result.biggestIncrease!.change).toBe(400);
  });

  it("identifies biggest spending decrease by category", () => {
    const categories = [
      makeCategory({ id: "cat-food", name: "Alimentação" }),
      makeCategory({ id: "cat-transport", name: "Transporte" }),
    ];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 500, "cat-transport": 300 },
          }),
          "2024-02": makeMonthlyEntry({
            expensesByCategory: { "cat-food": 200, "cat-transport": 250 },
          }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01", "2024-02"],
      categories,
    });

    expect(result.biggestDecrease).not.toBeNull();
    expect(result.biggestDecrease!.name).toBe("Alimentação");
    expect(result.biggestDecrease!.change).toBe(-300);
  });

  it("returns null for increase/decrease with only one month", () => {
    const result = calculateReportInsights({
      report: asReport(makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({ expenses: 1000 }),
        },
      })),
      selectedMonths: ["2024-01"],
      categories: [],
    });

    expect(result.biggestIncrease).toBeNull();
    expect(result.biggestDecrease).toBeNull();
  });

  it("calculates YTD totals for current year", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          [`${currentYear}-01`]: makeMonthlyEntry({ income: 5000, expenses: 3000 }),
          [`${currentYear}-02`]: makeMonthlyEntry({ income: 6000, expenses: 4000 }),
          "2023-12": makeMonthlyEntry({ income: 10000, expenses: 8000 }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: [`${currentYear}-01`, `${currentYear}-02`],
      categories: [],
    });

    expect(result.ytdIncome).toBe(11000);
    expect(result.ytdExpenses).toBe(7000);
    expect(result.ytdBalance).toBe(4000);
  });

  it("calculates average monthly spending across all months", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({ expenses: 1000 }),
          "2024-02": makeMonthlyEntry({ expenses: 2000 }),
          "2024-03": makeMonthlyEntry({ expenses: 3000 }),
          "2024-04": makeMonthlyEntry({ expenses: 4000 }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01", "2024-02"],
      categories: [],
    });

    // Average of ALL months: (1000+2000+3000+4000)/4 = 2500
    expect(result.averageMonthlySpending).toBe(2500);
  });

  it("calculates average monthly income across all months (ignores selection)", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({ income: 4000 }),
          "2024-02": makeMonthlyEntry({ income: 5000 }),
          "2024-03": makeMonthlyEntry({ income: 6000 }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      // Selection is narrower than the report — the average should still cover
      // the full history, matching averageMonthlySpending's semantics.
      selectedMonths: ["2024-01"],
      categories: [],
    });

    // (4000+5000+6000)/3 = 5000
    expect(result.averageMonthlyIncome).toBe(5000);
  });

  it("returns 0 for averages when no months exist", () => {
    const report = asReport(makeReport({}));

    const result = calculateReportInsights({
      report,
      selectedMonths: [],
      categories: [],
    });

    expect(result.averageMonthlySpending).toBe(0);
    expect(result.averageMonthlyIncome).toBe(0);
  });

  it("uses 'Desconhecido' for unknown categories in increase/decrease", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2024-01": makeMonthlyEntry({
            expensesByCategory: { "unknown-cat": 100 },
          }),
          "2024-02": makeMonthlyEntry({
            expensesByCategory: { "unknown-cat": 300 },
          }),
        },
      })
    );

    const result = calculateReportInsights({
      report,
      selectedMonths: ["2024-01", "2024-02"],
      categories: [],
    });

    expect(result.biggestIncrease!.name).toBe("Desconhecido");
  });
});
