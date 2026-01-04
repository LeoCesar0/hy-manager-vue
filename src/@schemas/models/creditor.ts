import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

export const zCreditorBase = z.object({
  id: z.string().optional(), // optional for create
  name: z.string(),
  categoryIds: z.array(zStringNotEmpty),
  userId: zStringNotEmpty,
});

export const zCreditor = zCreditorBase.extend(zCommonDoc.shape);

export type ICreditorBase = z.infer<typeof zCreditorBase>;
export type ICreditor = z.infer<typeof zCreditor>;
export type ICreateCreditor = z.infer<typeof zCreditorBase>;
export type IUpdateCreditor = z.infer<typeof zCreditorBase>;
