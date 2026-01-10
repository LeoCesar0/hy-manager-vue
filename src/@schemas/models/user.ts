import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./@common";

export const zUserBase = z.object({
  id: z.string(), // optional for create
  name: zStringNotEmpty,
  email: z.email(),
  imageUrl: z.string().nullish(),
  
});

export const zCreateUser = zUserBase.extend({
  id: z.string().optional(), // optional for create
});
export const zUpdateUser = zUserBase.omit({ id: true });

export const zUser = zUserBase.extend(zCommonDoc.shape);

export type IUser = z.infer<typeof zUser>;

export type IUserBase = z.infer<typeof zUserBase>;
export type ICreateUser = z.infer<typeof zCreateUser>;
export type IUpdateUser = z.infer<typeof zUpdateUser>;
