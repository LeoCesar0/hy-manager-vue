import { z } from "zod";
import { zCommonDoc } from "./@common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zFileBase = z.object({
  name: z.string(),
  size: z.coerce.number().nullish(),
  type: z.string(),
  userId: zStringNotEmpty,
  url: z.string(),
  path: z.string(),
});

export const zCreateFile = zFileBase.extend({
  id: z.string().optional(),
});

export const zUpdateFile = zFileBase;

export const zFileMin = zFileBase.extend({ id: zStringNotEmpty });
export const zFile = zFileBase.extend(zCommonDoc.shape);

export type IFileBase = z.infer<typeof zFileBase>;
export type IFile = z.infer<typeof zFile>;
export type IFileMin = z.infer<typeof zFileMin>;
export type ICreateFile = z.infer<typeof zCreateFile>;
export type IUpdateFile = z.infer<typeof zUpdateFile>;
