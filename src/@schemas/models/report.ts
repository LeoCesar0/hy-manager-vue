import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

const zMonthlyEntry = z.object({
  income: z.number(),
  expenses: z.number(),
  transactionCount: z.number().default(0),
  expensesByCategory: z.record(z.string(), z.number()).default({}),
  depositsByCategory: z.record(z.string(), z.number()).default({}),
  expensesByCounterparty: z.record(z.string(), z.number()).default({}),
  depositsByCounterparty: z.record(z.string(), z.number()).default({}),
  // 2D cross-reference maps. Outer key is categoryId so the dominant access
  // pattern ("iterate positive-expense categories, subtract their share from
  // each counterparty") is direct. Inner map accumulates by counterpartyId.
  expensesByCategoryAndCounterparty: z
    .record(z.string(), z.record(z.string(), z.number()))
    .default({}),
  depositsByCategoryAndCounterparty: z
    .record(z.string(), z.record(z.string(), z.number()))
    .default({}),
  // Per-dimension transaction counts — enables frequency-based insights
  // ("47 idas no Mercado"), ticket médio (amount / count), and
  // per-counterparty Objetivos without re-walking raw transactions.
  expensesByCategoryCount: z.record(z.string(), z.number()).default({}),
  depositsByCategoryCount: z.record(z.string(), z.number()).default({}),
  expensesByCounterpartyCount: z.record(z.string(), z.number()).default({}),
  depositsByCounterpartyCount: z.record(z.string(), z.number()).default({}),
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
