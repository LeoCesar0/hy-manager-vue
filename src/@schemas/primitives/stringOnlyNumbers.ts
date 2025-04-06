import { z } from "zod";

export const zStringOnlyNumbers = z.string().superRefine((val, ctx) => {
  const value = Number(val);
  if (isNaN(value)) {
    return ctx.addIssue({
      message: "Value must be a number",
      code: "custom",
    });
  }
});
