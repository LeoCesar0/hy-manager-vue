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

export const zUpdateCounterparty = zCounterpartyBase;

// `slugifiedName` is a persisted, indexed normalization of `name` used for
// O(1) lookups (getOrCreateCounterparty) and future prefix search. It lives
// only on the stored doc — write services derive it from `name`, callers never
// pass it. Reads don't run Zod, so pre-migration docs (missing the field) load
// fine; a one-shot login migration backfills them.
export const zCounterparty = zCounterpartyBase
  .extend(zCommonDoc.shape)
  .extend({
    slugifiedName: z.string(),
  });

export type ICounterpartyBase = z.infer<typeof zCounterpartyBase>;
export type ICounterparty = z.infer<typeof zCounterparty>;
export type ICreateCounterparty = z.infer<typeof zCreateCounterparty>;
export type IUpdateCounterparty = z.infer<typeof zUpdateCounterparty>;
