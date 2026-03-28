import type { DefaultCategory } from "~/static/default-categories";
import { createBankAccount } from "~/services/api/bank-accounts/create-bank-account";
import { setupDefaultCategories } from "~/services/api/categories/setup-default-categories";
import { updateUser } from "~/services/api/users/update-user";

export const useOnboarding = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);
  const router = useRouter();

  const currentStep = ref(1);
  const totalSteps = 3;
  const userName = ref(currentUser.value?.name || "");
  const bankAccountName = ref("");
  const isSubmitting = ref(false);

  const goToNextStep = () => {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  };

  const goToPreviousStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  };

  const handleWelcomeNext = (name: string) => {
    userName.value = name;
    goToNextStep();
  };

  const handleBankAccountNext = (name: string) => {
    bankAccountName.value = name;
    goToNextStep();
  };

  const completeOnboarding = async (selectedCategories: DefaultCategory[]) => {
    if (!currentUser.value) return;

    isSubmitting.value = true;
    const userId = currentUser.value.id;
    const silentOptions = { toastOptions: { loading: false, success: false, error: true } } as const;

    try {
      // Step 1: Update user name if changed
      if (userName.value !== currentUser.value.name) {
        await updateUser({
          id: userId,
          data: { name: userName.value },
          options: silentOptions,
        });
      }

      // Step 2: Create bank account
      const bankAccountRes = await createBankAccount({
        data: { name: bankAccountName.value, userId },
        options: silentOptions,
      });

      if (!bankAccountRes.data) {
        throw new Error("Falha ao criar conta bancária");
      }

      // Step 3: Setup selected categories
      await setupDefaultCategories({
        userId,
        selectedCategories,
        options: silentOptions,
      });

      // Step 4: Mark onboarding complete
      const updateRes = await updateUser({
        id: userId,
        data: { hasCompletedOnboarding: true },
        options: silentOptions,
      });

      if (updateRes.data) {
        currentUser.value = updateRes.data;
      }

      router.push("/dashboard");
    } finally {
      isSubmitting.value = false;
    }
  };

  const autoHealExistingUser = async () => {
    if (!currentUser.value) return false;
    if (currentUser.value.hasCompletedOnboarding) return true;

    const dashboardStore = useDashboardStore();
    // Wait for bank accounts to load if still loading
    if (dashboardStore.isLoadingBankAccounts) {
      await new Promise<void>((resolve) => {
        const stop = watch(
          () => dashboardStore.isLoadingBankAccounts,
          (loading) => {
            if (!loading) {
              stop();
              resolve();
            }
          },
        );
      });
    }

    if (dashboardStore.bankAccounts.length > 0) {
      await updateUser({
        id: currentUser.value.id,
        data: { hasCompletedOnboarding: true },
        options: { toastOptions: { loading: false, success: false, error: false } },
      });
      currentUser.value = { ...currentUser.value, hasCompletedOnboarding: true };
      return true;
    }

    return false;
  };

  return {
    currentStep,
    totalSteps,
    userName,
    bankAccountName,
    isSubmitting,
    goToNextStep,
    goToPreviousStep,
    handleWelcomeNext,
    handleBankAccountNext,
    completeOnboarding,
    autoHealExistingUser,
  };
};
