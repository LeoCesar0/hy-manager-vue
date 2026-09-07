import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { makeReport, makeCategory, makeMonthlyEntry } from "../../helpers";
import { calculateTicketFrequency } from "~/services/analytics/calculate-ticket-frequency";
import type { IReport } from "~/@schemas/models/report";

const asReport = (base: ReturnType<typeof makeReport>): IReport =>
  ({ ...base, id: "report-1", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }) as IReport;

describe("calculateTicketFrequency", () => {
  const categories = [
    makeCategory({ id: "cat-market", name: "Mercado" }),
    makeCategory({ id: "cat-fuel", name: "Combustível" }),
    makeCategory({ id: "cat-invest", name: "Investimentos", isPositiveExpense: true }),
  ];

  it("computes average ticket as amount / count and frequency as the count, summed across months", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-market": 1000 },
            expensesByCategoryCount: { "cat-market": 10 },
          }),
          "2025-02": makeMonthlyEntry({
            expensesByCategory: { "cat-market": 1010 },
            expensesByCategoryCount: { "cat-market": 13 },
          }),
        },
      })
    );

    const result = calculateTicketFrequency({
      report,
      selectedMonths: ["2025-01", "2025-02"],
      categories,
    });

    const market = result.find((r) => r.categoryId === "cat-market")!;
    expect(market.total).toBe(2010);
    expect(market.count).toBe(23);
    // 2010 / 23 = 87.39…
    expect(market.averageTicket).toBe(87.39);
  });

  it("orders by total spend and caps at top N, excluding positive-expense categories", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-market": 500, "cat-fuel": 900, "cat-invest": 5000 },
            expensesByCategoryCount: { "cat-market": 5, "cat-fuel": 3, "cat-invest": 1 },
          }),
        },
      })
    );

    const result = calculateTicketFrequency({
      report,
      selectedMonths: ["2025-01"],
      categories,
      topN: 2,
    });

    expect(result.map((r) => r.categoryId)).toEqual(["cat-fuel", "cat-market"]);
    expect(result.some((r) => r.categoryId === "cat-invest")).toBe(false);
  });

  it("drops categories with spend but no transaction count", () => {
    const report = asReport(
      makeReport({
        monthlyBreakdown: {
          "2025-01": makeMonthlyEntry({
            expensesByCategory: { "cat-market": 300 },
            expensesByCategoryCount: {},
          }),
        },
      })
    );

    const result = calculateTicketFrequency({
      report,
      selectedMonths: ["2025-01"],
      categories,
    });

    expect(result).toEqual([]);
  });
});
