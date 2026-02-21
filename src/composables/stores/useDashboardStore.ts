
import { makeStoreKey } from "~/helpers/makeStoreKey";

export const useDashboardStore = defineStore(makeStoreKey("dashboard"), () => {
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);
  const isLoadingDashboard = computed(() => !currentUser.value)

  return {
    isLoadingDashboard
  };
});
