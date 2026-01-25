export const useOnboarding = () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  return {
  };
};
