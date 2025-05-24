import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zTimestamp } from "../firebase";

export const zCommonDoc = z.object({
  id: zStringNotEmpty,
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
  disabled: z.boolean().nullish().default(false),
});
