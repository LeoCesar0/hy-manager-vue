import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { makeStoreKey } from "~/helpers/makeStoreKey";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";

export const useDashboardStore = defineStore(makeStoreKey("dashboard"), () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  const bankAccounts = ref<IBankAccount[]>([]);
  const currentBankAccount = ref<IBankAccount | null>(null);
  const isLoadingBankAccounts = ref(false);

  const isLoadingDashboard = computed(
    () => !currentUser.value || !currentBankAccount.value,
  );

  const lastSelectedBankAccountId = useLocalStorage<string | null>(
    "lastSelectedBankAccountId",
    null,
    {
      serializer: StorageSerializers.string,
    },
  );

  watch(
    currentBankAccount,
    (currentBankAccount) => {
      if (currentBankAccount) {
        lastSelectedBankAccountId.value = currentBankAccount.id;
      }
    },
    { immediate: true },
  );

  const loadBankAccounts = async () => {
    if (!currentUser.value) return;

    isLoadingBankAccounts.value = true;
    try {
      const response = await getBankAccounts({
        userId: currentUser.value.id,
        pagination: { page: 1, limit: 100 },
        options: { toastOptions: undefined },
      });

      if (response.data?.list) {
        bankAccounts.value = response.data.list;
        if (bankAccounts.value.length > 0) {
          const foundStoredAccount = bankAccounts.value.find(
            (account) => account.id === lastSelectedBankAccountId.value,
          );
          if (!foundStoredAccount) {
            lastSelectedBankAccountId.value = null;
          }
          const preSelected = foundStoredAccount
            ? foundStoredAccount
            : bankAccounts.value[0];
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
    bankAccounts.value = [];
    currentBankAccount.value = null;
    isLoadingBankAccounts.value = false;
  };

  watch(currentUser, (currentUser) => {
    if (currentUser && !isLoadingDashboard.value) {
      loadBankAccounts();
    }
  });

  return {
    bankAccounts,
    currentBankAccount,
    isLoadingBankAccounts,
    isLoadingDashboard,
    loadBankAccounts,
    setCurrentBankAccount,
    resetStore,
  };
});
