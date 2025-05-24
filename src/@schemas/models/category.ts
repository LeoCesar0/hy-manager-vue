import { z } from "zod";
import { zCommonDoc } from "./common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zCategoryBase = z.object({
  name: z.string(),
  color: z.string().nullish(),
  icon: z.string().nullish(),
  userId: zStringNotEmpty,
});

export const zCategory = zCategoryBase.merge(zCommonDoc);

export type ICategoryBase = z.infer<typeof zCategoryBase>;
export type ICategory = z.infer<typeof zCategory>;
export type ICreateCategory = z.infer<typeof zCategory>;
export type IUpdateCategory = z.infer<typeof zCategory>;
