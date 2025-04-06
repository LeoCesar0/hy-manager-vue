import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./common";
import { zFlexDate } from "../primitives/zFlexDate";

const zTransactionType = z.enum(["deposit", "expense"]);

export const zTransaction = z
  .object({
    type: zTransactionType,
    amount: z.coerce.number(),
    description: z.string(),
    date: zFlexDate,
    categoryId: zStringNotEmpty.nullish(),
    creditorId: zStringNotEmpty.nullish(),
    userId: zStringNotEmpty,
  })
  .merge(zCommonDoc);
