import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  makeReport,
  makeCategory,
  makeCounterparty,
  makeMonthlyEntry,
} from "../../helpers";
import { calculateCategoryWindowSummary } from "~/services/analytics/calculate-category-window-summary";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

const WINDOW = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
];

describe("calculateCategoryWindowSummary", () => {
  it("summarizes an expense-dominant category: peak/trough, share, trend up, top identifiers", () => {
    const categories = [makeCategory({ id: "cat-market", name: "Mercado" })];
    const counterparties = [
      makeCounterparty({ id: "cp-pao", name: "Pão de Açúcar" }),
      makeCounterparty({ id: "cp-carrefour", name: "Carrefour" }),
    ];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          // prior 3 months sum 300, recent 3 months sum 600 → trend +100%.
          "2025-01": makeMonthlyEntry({
            expenses: 100,
            expensesByCategory: { "cat-market": 100 },
            expensesByCategoryAndCounterparty: { "cat-market": { "cp-pao": 60, "cp-carrefour": 40 } },
          }),
          "2025-02": makeMonthlyEntry({
            expenses: 100,
            expensesByCategory: { "cat-market": 100 },
            expensesByCategoryAndCounterparty: { "cat-market": { "cp-pao": 70, "cp-carrefour": 30 } },
          }),
          "2025-03": makeMonthlyEntry({
            expenses: 100,
            expensesByCategory: { "cat-market": 100 },
            expensesByCategoryAndCounterparty: { "cat-market": { "cp-pao": 50, "cp-carrefour": 50 } },
          }),
          "2025-04": makeMonthlyEntry({
            expenses: 200,
            expensesByCategory: { "cat-market": 200 },
            expensesByCategoryAndCounterparty: { "cat-market": { "cp-pao": 120, "cp-carrefour": 80 } },
          }),
          "2025-05": makeMonthlyEntry({
            expenses: 100,
            expensesByCategory: { "cat-market": 100 },
            expensesByCategoryAndCounterparty: { "cat-market": { "cp-pao": 60, "cp-carrefour": 40 } },
          }),
          "2025-06": makeMonthlyEntry({
            expenses: 300,
            expensesByCategory: { "cat-market": 300 },
            expensesByCategoryAndCounterparty: { "cat-market": { "cp-pao": 200, "cp-carrefour": 100 } },
          }),
        },
      })
    );

    const result = calculateCategoryWindowSummary({
      report,
      categories,
      counterparties,
      categoryId: "cat-market",
      referenceMonths: WINDOW,
    });

    expect(result.primaryFlow).toBe("expense");
    // total expense 900 over 6 months → average 150.
    expect(result.expenseAverage).toBe(150);
    expect(result.peakMonth).toEqual({ key: "2025-06", value: 300 });
    expect(result.troughMonth).toEqual({ key: "2025-01", value: 100 });
    // recent (apr+may+jun)=600 vs prior (jan+feb+mar)=300 → +100%.
    expect(result.trend).toEqual({ direction: "up", percent: 100 });
    // category is the only expense in the account → 100% share.
    expect(result.shareOfExpenses).toBe(100);
    // Pão de Açúcar total 560 > Carrefour 340.
    expect(result.topIdentifiers[0]).toEqual({
      id: "cp-pao",
      name: "Pão de Açúcar",
      amount: 560,
    });
  });

  it("uses the deposit flow when deposits dominate", () => {
    const categories = [makeCategory({ id: "cat-salary", name: "Salário" })];

    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            income: 5000,
            depositsByCategory: { "cat-salary": 5000 },
          }),
          "2025-02": makeMonthlyEntry({
            income: 5000,
            depositsByCategory: { "cat-salary": 5000 },
          }),
        },
      })
    );

    const result = calculateCategoryWindowSummary({
      report,
      categories,
      counterparties: [],
      categoryId: "cat-salary",
      referenceMonths: WINDOW,
    });

    expect(result.primaryFlow).toBe("deposit");
    // 10000 over 2 active months → average 5000 (active-months semantics).
    expect(result.depositAverage).toBe(5000);
    expect(result.shareOfDeposits).toBe(100);
  });
});
