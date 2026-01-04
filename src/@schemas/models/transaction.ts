import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";
import { zTimestamp } from "../firebase";

const zTransactionType = z.enum(["deposit", "expense"]);

export const zTransactionBase = z.object({
  id: z.string().optional(), // optional for create
  type: zTransactionType,
  amount: z.coerce.number(),
  description: z.string(),
  date: zTimestamp,
  categoryId: zStringNotEmpty.nullish(),
  creditorId: zStringNotEmpty.nullish(),
  userId: zStringNotEmpty,
});

export const zTransaction = zTransactionBase.extend(zCommonDoc.shape);

export type ITransactionBase = z.infer<typeof zTransactionBase>;
export type ITransaction = z.infer<typeof zTransaction>;
export type ICreateTransaction = z.infer<typeof zTransactionBase>;
export type IUpdateTransaction = z.infer<typeof zTransactionBase>;
