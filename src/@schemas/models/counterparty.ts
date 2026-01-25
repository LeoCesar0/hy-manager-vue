import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

export const zCounterpartyBase = z.object({
  name: z.string(),
  categoryIds: z.array(zStringNotEmpty),
  userId: zStringNotEmpty,
});

export const zCreateCounterparty = zCounterpartyBase.extend({
  id: z.string().optional(),
});

export const zUpdateCounterparty = zCounterpartyBase

export const zCounterparty = zCounterpartyBase.extend(zCommonDoc.shape);

export type ICounterpartyBase = z.infer<typeof zCounterpartyBase>;
export type ICounterparty = z.infer<typeof zCounterparty>;
export type ICreateCounterparty = z.infer<typeof zCreateCounterparty>;
export type IUpdateCounterparty = z.infer<typeof zUpdateCounterparty>;
