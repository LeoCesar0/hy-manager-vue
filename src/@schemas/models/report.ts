import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

const zMonthlyEntry = z.object({
  income: z.number(),
  expenses: z.number(),
});

export const zReportBase = z.object({
  userId: zStringNotEmpty,
  bankAccountId: zStringNotEmpty,
  totalIncome: z.number(),
  totalExpenses: z.number(),
  transactionCount: z.number(),
  expensesByCategory: z.record(z.string(), z.number()),
  depositsByCategory: z.record(z.string(), z.number()),
  expensesByCounterparty: z.record(z.string(), z.number()),
  depositsByCounterparty: z.record(z.string(), z.number()),
  monthlyBreakdown: z.record(z.string(), zMonthlyEntry),
});

export const zReport = zReportBase.extend(zCommonDoc.shape);

export type IReportBase = z.infer<typeof zReportBase>;
export type IReport = z.infer<typeof zReport>;
export type IMonthlyEntry = z.infer<typeof zMonthlyEntry>;
