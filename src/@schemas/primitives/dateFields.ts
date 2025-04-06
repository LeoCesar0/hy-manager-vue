import { z } from "zod";

export const zDateFields = z.object({
  year: z.number(),
  month: z.number(),
  day: z.number().nullish(),
});

export type IDateFields = z.infer<typeof zDateFields>;
