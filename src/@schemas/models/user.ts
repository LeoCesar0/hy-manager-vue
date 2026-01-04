import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

export const zUserBase = z.object({
  name: zStringNotEmpty,
  email: z.email(),
  imageUrl: z.string().nullish(),
});

export const zUser = zUserBase.extend(zCommonDoc.shape);

export type IUser = z.infer<typeof zUser>;

export type IUserBase = z.infer<typeof zUserBase>;

export type ICreateUser = z.infer<typeof zUser>;
export type IUpdateUser = z.infer<typeof zUser>;
