import { z, ZodObject } from "zod";
import { zBankAccount } from "~/@schemas/models/bank-account";
import { zCategory } from "~/@schemas/models/category";
import { zCreditor } from "~/@schemas/models/creditor";
import { zFile } from "~/@schemas/models/file";
import { zTransaction } from "~/@schemas/models/transaction";
import { zUser } from "~/@schemas/models/user";

export const zFirebaseCollection = z.enum([
  "users",
  "bankAccounts",
  "transactions",
  "creditors",
  "files",
  "categories",
]);

export type FirebaseCollection = z.infer<typeof zFirebaseCollection>;

export const COLLECTION_SCHEMA: Record<FirebaseCollection, ZodObject> = {
  users: zUser,
  bankAccounts: zBankAccount,
  transactions: zTransaction,
  creditors: zCreditor,
  files: zFile,
  categories: zCategory,
};
