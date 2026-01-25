import { z } from "zod";
import { zCommonDoc } from "./@common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zCategoryBase = z.object({
  name: z.string(),
  color: z.string().nullish(),
  icon: z.string().nullish(),
  userId: zStringNotEmpty,
});

export const zCreateCategory = zCategoryBase.extend({
  id: z.string().optional(),
});

export const zUpdateCategory = zCategoryBase;

export const zCategory = zCategoryBase.extend(zCommonDoc.shape);

export type ICategoryBase = z.infer<typeof zCategoryBase>;
export type ICategory = z.infer<typeof zCategory>;
export type ICreateCategory = z.infer<typeof zCreateCategory>;
export type IUpdateCategory = z.infer<typeof zUpdateCategory>;
