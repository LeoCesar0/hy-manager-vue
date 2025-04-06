import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zFlexDate } from "../primitives/zFlexDate";

export const zCommonDoc = z.object({
  id: zStringNotEmpty,
  createdAt: zFlexDate,
  updatedAt: zFlexDate,
  disabled: z.boolean().default(false),
});
