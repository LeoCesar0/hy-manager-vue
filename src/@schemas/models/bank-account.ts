import { z } from "zod";
import { zCommonDoc } from "./@common";
import { zStringNotEmpty } from "../primitives/stringNotEmpty";

// Known banking providers. "other" is the escape hatch for accounts whose
// bank isn't explicitly supported — users can still create them, they just
// lose access to provider-gated features (currently: CSV statement import).
export const bankAccountCompanies = ["nubank", "inter", "other"] as const;
export const zBankAccountCompany = z.enum(bankAccountCompanies);
export type IBankAccountCompany = z.infer<typeof zBankAccountCompany>;

// Display labels for UI pickers. Kept inline with the enum so adding a new
// bank is a one-file change.
export const BANK_ACCOUNT_COMPANY_LABELS: Record<IBankAccountCompany, string> = {
  nubank: "Nubank",
  inter: "Inter",
  other: "Outro",
};

export const zBankAccountBase = z.object({
  name: zStringNotEmpty,
  userId: zStringNotEmpty,
  // Default "other" absorbs legacy docs created before this field existed.
  // No write migration required — existing accounts load with company="other"
  // and can be upgraded by the user on next edit.
  company: zBankAccountCompany.default("other"),
});

export const zCreateBankAccount = zBankAccountBase.extend({
  id: z.string().optional(),
});

export const zUpdateBankAccount = zBankAccountBase;

export const zBankAccount = zBankAccountBase.extend(zCommonDoc.shape);

export type IBankAccountBase = z.infer<typeof zBankAccountBase>;
export type IBankAccount = z.infer<typeof zBankAccount>;
export type ICreateBankAccount = z.infer<typeof zCreateBankAccount>;
export type IUpdateBankAccount = z.infer<typeof zUpdateBankAccount>;
