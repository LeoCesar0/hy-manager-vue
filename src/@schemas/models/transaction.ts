import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";
import { zTimestamp } from "../firebase";

const zTransactionType = z.enum(["deposit", "expense"]);

export const zTransactionCategorySplit = z.object({
  categoryId: zStringNotEmpty,
  amount: z.coerce.number().positive(),
  percentage: z.coerce.number().min(0).max(100).optional(),
});

export const zTransactionBase = z.object({
  type: zTransactionType,
  amount: z.coerce.number(),
  description: z.string(),
  date: zTimestamp,
  categoryId: zStringNotEmpty.nullish(),
  creditorId: zStringNotEmpty.nullish(),
  userId: zStringNotEmpty,
  bankAccountId: zStringNotEmpty,
  categorySplits: z.array(zTransactionCategorySplit).optional(),
}).refine(
  (data) => {
    if (!data.categorySplits || data.categorySplits.length === 0) {
      return true;
    }
    const totalSplitAmount = data.categorySplits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    return Math.abs(totalSplitAmount - Math.abs(data.amount)) < 0.01;
  },
  {
    message: "Category splits must sum to transaction amount",
    path: ["categorySplits"],
  }
);
export const zCreateTransaction = zTransactionBase.extend({
  id: z.string().optional(),
})

export const zTransaction = zTransactionBase.extend(zCommonDoc.shape);

export type ITransactionCategorySplit = z.infer<typeof zTransactionCategorySplit>;
export type ITransactionBase = z.infer<typeof zTransactionBase>;
export type ITransaction = z.infer<typeof zTransaction>;
export type ICreateTransaction = z.infer<typeof zTransactionBase>;
export type IUpdateTransaction = z.infer<typeof zTransactionBase>;
