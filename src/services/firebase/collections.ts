import { z } from "zod";

export const zFirebaseCollection = z.enum([
  "users",
  "bankAccounts",
  "transactions",
  "creditors",
  "files",
]);

export type FirebaseCollection = z.infer<typeof zFirebaseCollection>;
