import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./common";

export const zCreditor = z
  .object({
    name: z.string(),
    categoryIds: z.array(zStringNotEmpty),
    userId: zStringNotEmpty,
  })
  .merge(zCommonDoc);

export type ICreditor = z.infer<typeof zCreditor>;
