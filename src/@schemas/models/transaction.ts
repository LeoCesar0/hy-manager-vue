import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./common";
import { zFlexDate } from "../primitives/zFlexDate";
import { zTimestamp } from "../firebase";

const zTransactionType = z.enum(["deposit", "expense"]);

export const zTransactionBase = z.object({
  type: zTransactionType,
  amount: z.coerce.number(),
  description: z.string(),
  date: zTimestamp,
  categoryId: zStringNotEmpty.nullish(),
  creditorId: zStringNotEmpty.nullish(),
  userId: zStringNotEmpty,
});

export const zTransaction = zTransactionBase.merge(zCommonDoc);

export type ITransactionBase = z.infer<typeof zTransactionBase>;
export type ITransaction = z.infer<typeof zTransaction>;
export type ICreateTransaction = z.infer<typeof zTransaction>;
export type IUpdateTransaction = z.infer<typeof zTransaction>;
