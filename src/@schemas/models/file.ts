import { z } from "zod";
import { zCommonDoc } from "./common";

export const zFileBase = z.object({
  name: z.string(),
  size: z.coerce.number().nullish(),
  type: z.string(),
  user: z.string(),
  url: z.string(),
  path: z.string(),
});

export const zFileMin = zFileBase;
export const zFile = zFileBase.merge(zCommonDoc);

export type IFileBase = z.infer<typeof zFileBase>;
export type IFile = z.infer<typeof zFile>;
export type IFileMin = z.infer<typeof zFileMin>;
