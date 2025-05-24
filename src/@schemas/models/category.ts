import { z } from "zod";
import { zCommonDoc } from "./common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

export const zCategory = z
  .object({
    name: z.string(),
    color: z.string().nullish(),
    icon: z.string().nullish(),
    userId: zStringNotEmpty,
  })
  .merge(zCommonDoc);

export type ICategory = z.infer<typeof zCategory>;
