import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./common";

export const zCreditorBase = z.object({
  name: z.string(),
  categoryIds: z.array(zStringNotEmpty),
  userId: zStringNotEmpty,
});

export const zCreditor = zCreditorBase.merge(zCommonDoc);

export type ICreditorBase = z.infer<typeof zCreditorBase>;
export type ICreditor = z.infer<typeof zCreditor>;
export type ICreateCreditor = z.infer<typeof zCreditor>;
export type IUpdateCreditor = z.infer<typeof zCreditor>;
