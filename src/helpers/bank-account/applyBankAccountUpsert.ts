import type { IBankAccount } from "~/@schemas/models/bank-account";

type IApplyBankAccountUpsert = {
  accounts: IBankAccount[];
  current: IBankAccount | null;
  account: IBankAccount;
};

type IBankAccountStateResult = {
  accounts: IBankAccount[];
  current: IBankAccount | null;
};

/**
 * Pure state transition for inserting/updating a bank account in the dashboard
 * store. Replaces in place when the id already exists (preserving order),
 * otherwise appends. Patches `current` when the upserted account is the
 * selected one, and auto-selects a freshly created account when nothing is
 * selected yet — mirroring the selection intent of `loadBankAccounts`.
 */
export const applyBankAccountUpsert = ({
  accounts,
  current,
  account,
}: IApplyBankAccountUpsert): IBankAccountStateResult => {
  const exists = accounts.some((item) => item.id === account.id);

  const nextAccounts = exists
    ? accounts.map((item) => (item.id === account.id ? account : item))
    : [...accounts, account];

  let nextCurrent = current;

  if (current && current.id === account.id) {
    // Selected account was edited — reflect the new fields everywhere.
    nextCurrent = account;
  } else if (!current) {
    // First account created (or selection was empty) — auto-select it.
    nextCurrent = account;
  }

  return { accounts: nextAccounts, current: nextCurrent };
};
