import { z, ZodObject } from "zod";
import { zBankAccount } from "~/@schemas/models/bank-account";
import { zCategory } from "~/@schemas/models/category";
import { zCounterparty } from "~/@schemas/models/counterparty";
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
  creditors: zCounterparty,
  files: zFile,
  categories: zCategory,
};
