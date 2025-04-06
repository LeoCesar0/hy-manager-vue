import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./common";
import { zFlexDate } from "../primitives/zFlexDate";

export const zCreditor = z
  .object({
    name: z.string(),
    categoryIds: z.array(zStringNotEmpty),
    userId: zStringNotEmpty,
  })
  .merge(zCommonDoc);
