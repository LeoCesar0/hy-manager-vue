import { z } from "zod";

export const zStringOnlyDigits = z.string().superRefine((val, ctx) => {
  // Regex should allow only numbers, dot, parentheses, and hyphens
  const regex = /^[0-9-.()]+$/;

  if (!regex.test(val)) {
    return ctx.addIssue({
      message: "Value must contain only digits, parentheses, hyphens, and dots",
      code: "custom",
    });
  }
});
