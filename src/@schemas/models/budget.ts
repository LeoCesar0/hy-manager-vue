import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

const zCategoryBudget = z.object({
  categoryId: zStringNotEmpty,
  type: z.enum(["expense", "deposit"]),
  amount: z.coerce.number().pipe(z.number().positive()),
});

export const zBudgetBase = z.object({
  userId: zStringNotEmpty,
  bankAccountId: zStringNotEmpty,
  monthlyExpenseLimit: z.number().nullable(),
  monthlyIncomeGoal: z.number().nullable(),
  categoryBudgets: zCategoryBudget.array(),
});

export const zBudget = zBudgetBase.extend(zCommonDoc.shape);

export type IBudgetBase = z.infer<typeof zBudgetBase>;
export type IBudget = z.infer<typeof zBudget>;
export type ICategoryBudget = z.infer<typeof zCategoryBudget>;
