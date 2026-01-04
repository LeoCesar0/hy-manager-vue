import { z } from "zod";

export const zStringNotEmpty = z
  .string({ error: "Field is required" })
  .min(1, { message: "Field is required" });
