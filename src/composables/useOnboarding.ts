export const useOnboarding = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  const hasCompletedOnboarding = computed(() => {
    return false;
  });

  const checkOnboardingStatus = async () => {
    if (!currentUser.value) return { needsOnboarding: false };

    const firebaseStore = useFirebaseStore();

    const [bankAccountsResult, categoriesResult] = await Promise.all([
      firebaseStore.modelList({
        collection: "bankAccounts",
        where: [
          {
            field: "userId",
            operator: "==",
            value: currentUser.value.id,
          },
        ],
      }),
      firebaseStore.modelList({
        collection: "categories",
        where: [
          {
            field: "userId",
            operator: "==",
            value: currentUser.value.id,
          },
        ],
      }),
    ]);

    const hasBankAccounts = bankAccountsResult.data && bankAccountsResult.data.length > 0;
    const hasCategories = categoriesResult.data && categoriesResult.data.length > 0;

    return {
      needsOnboarding: !hasBankAccounts || !hasCategories,
      hasBankAccounts,
      hasCategories,
    };
  };

  return {
    hasCompletedOnboarding,
    checkOnboardingStatus,
  };
};
