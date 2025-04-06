import z from "zod";
import { zStringNotEmpty } from "./primitives/stringNotEmpty";

export const zSignIn = z.object({
  email: zStringNotEmpty.email(),
  password: zStringNotEmpty,
});

export type ISignIn = z.infer<typeof zSignIn>;
