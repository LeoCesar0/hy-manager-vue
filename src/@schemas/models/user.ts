import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

export const zUserBase = z.object({
  name: zStringNotEmpty,
  email: z.email(),
  imageUrl: z.string().nullish(),
  hasCompletedOnboarding: z.boolean().nullish(),
  // One-shot data migrations already applied for this user. Each flag is set
  // once the corresponding client-side backfill completes (see
  // services/api/migrations/). Optional so existing user docs stay valid.
  migrations: z
    .object({
      counterpartySlug: z.boolean().optional(),
    })
    .nullish(),
});

export const zCreateUser = zUserBase.extend({
  id: z.string().optional(), // optional for create
});
export const zUpdateUser = zUserBase

export const zUser = zUserBase.extend(zCommonDoc.shape);

export type IUser = z.infer<typeof zUser>;
export type IUserBase = z.infer<typeof zUserBase>;
export type ICreateUser = z.infer<typeof zCreateUser>;
export type IUpdateUser = z.infer<typeof zUpdateUser>;
