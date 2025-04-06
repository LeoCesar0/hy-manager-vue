import { z } from "zod";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";
import { zCommonDoc } from "./common";

export const zUser = z
  .object({
    name: zStringNotEmpty,
    email: z.string().email(),
    imageUrl: z.string().nullish(),
  })
  .merge(zCommonDoc);
