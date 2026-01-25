import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";
import { zTimestamp } from "../firebase";

const zTransactionType = z.enum(["deposit", "expense"]);

export const zTransactionBase = z.object({
  type: zTransactionType,
  amount: z.coerce.number(),
  description: z.string(),
  date: zTimestamp,
  categoryIds: zStringNotEmpty.array(),
  counterpartyId: zStringNotEmpty.nullish(),
  userId: zStringNotEmpty,
  bankAccountId: zStringNotEmpty,
})
export const zCreateTransaction = zTransactionBase.extend({
  id: z.string().optional(),
})

export const zTransaction = zTransactionBase.extend(zCommonDoc.shape);

export type ITransactionBase = z.infer<typeof zTransactionBase>;
export type ITransaction = z.infer<typeof zTransaction>;
export type ICreateTransaction = z.infer<typeof zCreateTransaction>;
export type IUpdateTransaction = z.infer<typeof zTransactionBase>;
