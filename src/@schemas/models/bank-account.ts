import { z } from "zod";
import { zCommonDoc } from "./@common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zBankAccountBase = z.object({
  id: z.string().optional(), // optional for create
  name: z.string(),
});

export const zBankAccount = zBankAccountBase.extend(zCommonDoc.shape);

export type IBankAccountBase = z.infer<typeof zBankAccountBase>;
export type IBankAccount = z.infer<typeof zBankAccount>;
export type ICreateBankAccount = z.infer<typeof zBankAccountBase>;
export type IUpdateBankAccount = z.infer<typeof zBankAccountBase>;
