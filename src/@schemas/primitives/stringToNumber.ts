import { z } from "zod";

export const zStringToNumber = z
  .string()
  .or(z.number())
  .transform((val, ctx) => {
    let hasError = false;
    if (!val && val !== 0) {
      hasError = true;
    }

    const num = Number(val);
    if (isNaN(num)) {
      hasError = true;
    }

    if (hasError) {
      ctx.addIssue({
        message: "Invalid number",
        code: "custom",
      });
      return null;
    }
    return num;
  });
