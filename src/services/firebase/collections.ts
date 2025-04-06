import { z } from "zod";

export const zFirebaseCollection = z.enum([
  "users",
  "bankAccounts",
  "transactions",
  "creditors",
]);

export type FirebaseCollection = z.infer<typeof zFirebaseCollection>;
