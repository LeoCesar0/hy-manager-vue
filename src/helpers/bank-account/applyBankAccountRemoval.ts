import type { IBankAccount } from "~/@schemas/models/bank-account";

type IApplyBankAccountRemoval = {
  accounts: IBankAccount[];
  current: IBankAccount | null;
  removedId: string;
};

type IBankAccountStateResult = {
  accounts: IBankAccount[];
  current: IBankAccount | null;
};

/**
 * Pure state transition for removing a bank account from the dashboard store.
 * When the removed account is the selected one, falls back to the
 * most-recently-updated remaining account (mirroring the `loadBankAccounts`
 * fallback), or `null` when the list becomes empty. Leaves `current` untouched
 * when a non-selected account is removed.
 */
export const applyBankAccountRemoval = ({
  accounts,
  current,
  removedId,
}: IApplyBankAccountRemoval): IBankAccountStateResult => {
  const nextAccounts = accounts.filter((item) => item.id !== removedId);

  if (!current || current.id !== removedId) {
    return { accounts: nextAccounts, current };
  }

  // Selected account was removed — pick the most-recently-updated survivor so
  // the user lands on "the one they were working with" mental model.
  const fallback = [...nextAccounts].sort(
    (a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis(),
  )[0];

  return { accounts: nextAccounts, current: fallback ?? null };
};
