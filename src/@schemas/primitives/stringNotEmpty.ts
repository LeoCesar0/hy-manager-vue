import { z } from "zod";

export const zStringNotEmpty = z
  .string({ error: "Campo obrigatório" })
  .min(1, { message: "Campo obrigatório" });
