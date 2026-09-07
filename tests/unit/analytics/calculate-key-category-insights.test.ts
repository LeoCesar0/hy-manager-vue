import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeReport, makeCategory, makeMonthlyEntry } from "../../helpers";
import {
  calculateKeyCategoryInsights,
  KEY_CATEGORY_NAMES,
} from "~/services/analytics/calculate-key-category-insights";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

// Fixed window so the test does not depend on the wall clock.
const WINDOW = ["2025-01", "2025-02", "2025-03", "2025-04"];

const keyCategories = () => [
  makeCategory({ id: "cat-desp", name: "Despesas", icon: "bills", color: "#3b82f6" }),
  makeCategory({ id: "cat-inv", name: "Investimentos", icon: "investments", color: "#16a34a" }),
  makeCategory({ id: "cat-sal", name: "Salário", icon: "work", color: "#22c55e" }),
  makeCategory({ id: "cat-card", name: "Cartão de Crédito", icon: "card", color: "#dc2626" }),
];

describe("calculateKeyCategoryInsights", () => {
  it("resolves the default categories by name and carries their icon/color", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expensesByCategory: { "cat-desp": 1000 } }),
          "2025-03": makeMonthlyEntry({ expensesByCategory: { "cat-desp": 2000 } }),
        },
      })
    );

    const result = calculateKeyCategoryInsights({
      report,
      categories: keyCategories(),
      referenceMonths: WINDOW,
    });

    const despesas = result.find((r) => r.name === "Despesas")!;
    expect(despesas.icon).toBe("bills");
    expect(despesas.color).toBe("#3b82f6");
    // 3000 over 2 active months → 1500 (active-months averaging).
    expect(despesas.expense.average).toBe(1500);
    expect(despesas.expense.activeMonths).toBe(2);
    expect(despesas.dominantFlow).toBe("expense");
  });

  it("preserves the KEY_CATEGORY_NAMES order for resolved categories", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-desp": 100, "cat-card": 100 },
            depositsByCategory: { "cat-sal": 100, "cat-inv": 100 },
          }),
        },
      })
    );

    const result = calculateKeyCategoryInsights({
      report,
      categories: keyCategories(),
      referenceMonths: WINDOW,
    });

    expect(result.map((r) => r.name)).toEqual([...KEY_CATEGORY_NAMES]);
  });

  it("omits a category that is not present in the user's set (renamed/deleted)", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expensesByCategory: { "cat-desp": 500 } }),
        },
      })
    );

    const result = calculateKeyCategoryInsights({
      report,
      // "Salário" missing from the set entirely.
      categories: [makeCategory({ id: "cat-desp", name: "Despesas" })],
      referenceMonths: WINDOW,
    });

    expect(result.map((r) => r.name)).toEqual(["Despesas"]);
  });

  it("omits a resolved category that had no movement in either flow", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({ expensesByCategory: { "cat-desp": 500 } }),
        },
      })
    );

    const result = calculateKeyCategoryInsights({
      report,
      categories: keyCategories(),
      referenceMonths: WINDOW,
    });

    // Only Despesas had movement.
    expect(result.map((r) => r.name)).toEqual(["Despesas"]);
  });

  it("flags the dominant flow and exposes both flows when each has movement", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-sal": 200 },
            depositsByCategory: { "cat-sal": 5000 },
          }),
        },
      })
    );

    const result = calculateKeyCategoryInsights({
      report,
      categories: keyCategories(),
      referenceMonths: WINDOW,
    });

    const salary = result.find((r) => r.name === "Salário")!;
    expect(salary.dominantFlow).toBe("deposit");
    expect(salary.deposit.total).toBe(5000);
    expect(salary.expense.total).toBe(200);
  });
});
