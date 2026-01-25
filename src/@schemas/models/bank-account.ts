import { z } from "zod";
import { zCommonDoc } from "./@common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zBankAccountBase = z.object({
  name: zStringNotEmpty,
  userId: zStringNotEmpty,
});

export const zCreateBankAccount = zBankAccountBase.extend({
  id: z.string().optional(),
});

export const zUpdateBankAccount = zBankAccountBase;

export const zBankAccount = zBankAccountBase.extend(zCommonDoc.shape);

export type IBankAccountBase = z.infer<typeof zBankAccountBase>;
export type IBankAccount = z.infer<typeof zBankAccount>;
export type ICreateBankAccount = z.infer<typeof zCreateBankAccount>;
export type IUpdateBankAccount = z.infer<typeof zUpdateBankAccount>;
