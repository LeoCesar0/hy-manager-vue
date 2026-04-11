import type { IBankAccount } from "~/@schemas/models/bank-account";
import { makeStoreKey } from "~/helpers/makeStoreKey";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";

// Namespaced by user id so two users on the same browser don't cross-pollinate
// the "last selected account" preference. The `__anon` bucket only exists so
// the key is always a valid string; it's never written to because loading is
// gated on `currentUser`.
const buildStorageKey = (userId: string | null | undefined) =>
  `lastSelectedBankAccountId:${userId ?? "__anon"}`;

const readStoredBankAccountId = (userId: string): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(buildStorageKey(userId));
};

const writeStoredBankAccountId = (userId: string, id: string | null) => {
  if (typeof window === "undefined") return;
  const key = buildStorageKey(userId);
  if (id === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, id);
  }
};

export const useDashboardStore = defineStore(makeStoreKey("dashboard"), () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  const bankAccounts = ref<IBankAccount[]>([]);
  const currentBankAccount = ref<IBankAccount | null>(null);
  const isLoadingBankAccounts = ref(false);

  const isLoadingDashboard = computed(
    () => !currentUser.value || !currentBankAccount.value,
  );

  const hasNoBankAccounts = computed(
    () =>
      !!currentUser.value &&
      !isLoadingBankAccounts.value &&
      bankAccounts.value.length === 0,
  );

  // Persist the user's selection back to the per-user localStorage key. When
  // `currentBankAccount` is cleared (e.g. on logout via resetStore) we do NOT
  // wipe the key — that would defeat the purpose of remembering the selection
  // across sessions.
  watch(currentBankAccount, (account) => {
    if (account && currentUser.value) {
      writeStoredBankAccountId(currentUser.value.id, account.id);
    }
  });

  const loadBankAccounts = async () => {
    if (!currentUser.value) return;
    const userId = currentUser.value.id;

    isLoadingBankAccounts.value = true;
    try {
      const response = await getBankAccounts({
        userId,
        pagination: { page: 1, limit: 100 },
        options: { toastOptions: undefined },
      });

      if (response.data?.list) {
        bankAccounts.value = response.data.list;
        if (bankAccounts.value.length > 0) {
          const storedId = readStoredBankAccountId(userId);
          const foundStoredAccount = storedId
            ? bankAccounts.value.find((account) => account.id === storedId)
            : undefined;

          // Drop stale pointers (account was deleted or belongs to a different
          // user) so we don't keep resurrecting them on subsequent loads.
          if (storedId && !foundStoredAccount) {
            writeStoredBankAccountId(userId, null);
          }

          // Fallback: most recently updated account matches the "the one I was
          // working with" mental model better than arbitrary list order.
          const fallbackAccount = [...bankAccounts.value].sort(
            (a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis(),
          )[0];

          const preSelected = foundStoredAccount ?? fallbackAccount;
          if (preSelected && !currentBankAccount.value) {
            currentBankAccount.value = preSelected;
          }
        }
      }
    } finally {
      isLoadingBankAccounts.value = false;
    }
  };

  const setCurrentBankAccount = (bankAccount: IBankAccount | null) => {
    currentBankAccount.value = bankAccount;
  };

  const resetStore = () => {
    // Clear the current user's stored pointer so a subsequent login by a
    // different user on the same browser doesn't inherit it. The read path
    // is already user-scoped, but clearing here also handles the "user
    // explicitly logged out of their own account" case.
    if (currentUser.value) {
      writeStoredBankAccountId(currentUser.value.id, null);
    }
    bankAccounts.value = [];
    currentBankAccount.value = null;
    isLoadingBankAccounts.value = false;
  };

  watch(
    currentUser,
    (user, previousUser) => {
      if (user) {
        // New login (or initial load) — always reload accounts for the
        // current user. Account refs from the previous user are wiped first
        // to prevent the preSelected guard (`!currentBankAccount.value`) from
        // blocking a re-selection when switching users in the same session.
        if (previousUser && previousUser.id !== user.id) {
          bankAccounts.value = [];
          currentBankAccount.value = null;
        }
        loadBankAccounts();
      } else if (previousUser) {
        // Logout — clear in-memory state. Note: we don't wipe the stored id
        // here because resetStore() is the canonical teardown and a transient
        // auth blip (token refresh, etc.) shouldn't lose the selection.
        bankAccounts.value = [];
        currentBankAccount.value = null;
      }
    },
    { immediate: true },
  );

  return {
    bankAccounts,
    currentBankAccount,
    isLoadingBankAccounts,
    isLoadingDashboard,
    hasNoBankAccounts,
    loadBankAccounts,
    setCurrentBankAccount,
    resetStore,
  };
});
