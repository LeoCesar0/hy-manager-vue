import type { ICategory } from "~/@schemas/models/category";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { makeStoreKey } from "~/helpers/makeStoreKey";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCounterparties } from "~/services/api/counterparties/get-counterparties";

const silentOptions = {
  toastOptions: { loading: false, success: false, error: false },
} as const;

/**
 * Centralizes "reference data" (categories + counterparties) so the app loads
 * each collection once per session instead of re-fetching it in every page,
 * form and composable (~10 call sites). Strategy: load-once + refresh on
 * mutation (no onSnapshot). Single-tab consistency is sufficient here; mutating
 * services call `refresh()` after a successful write.
 */
export const useReferenceDataStore = defineStore(
  makeStoreKey("referenceData"),
  () => {
    const userStore = useUserStore();
    const { currentUser } = storeToRefs(userStore);

    const categories = ref<ICategory[]>([]);
    const counterparties = ref<ICounterparty[]>([]);
    const isLoading = ref(false);
    const loaded = ref(false);

    // De-dupes concurrent callers: while a load is in flight, everyone awaits
    // the same promise instead of firing parallel fetches.
    let inFlight: Promise<void> | null = null;

    const load = ({
      userId,
      force = false,
    }: {
      userId: string;
      force?: boolean;
    }): Promise<void> => {
      if (loaded.value && !force) return Promise.resolve();
      if (inFlight && !force) return inFlight;

      inFlight = (async () => {
        isLoading.value = true;
        try {
          const [categoriesRes, counterpartiesRes] = await Promise.all([
            getCategories({ userId, options: silentOptions }),
            getCounterparties({ userId, options: silentOptions }),
          ]);
          categories.value = categoriesRes.data ?? [];
          counterparties.value = counterpartiesRes.data ?? [];
          loaded.value = true;
        } finally {
          isLoading.value = false;
          inFlight = null;
        }
      })();

      return inFlight;
    };

    const refresh = ({ userId }: { userId: string }): Promise<void> =>
      load({ userId, force: true });

    /** Refresh using the currently authenticated user; no-op if logged out. */
    const refreshCurrent = (): Promise<void> => {
      if (!currentUser.value) return Promise.resolve();
      return refresh({ userId: currentUser.value.id });
    };

    const resetStore = () => {
      categories.value = [];
      counterparties.value = [];
      loaded.value = false;
      isLoading.value = false;
      inFlight = null;
    };

    // Counterparties with no category assigned. Derived in memory from the
    // already-loaded list so the dashboard header counter costs zero extra
    // reads (replaces loading all transactions just for this number).
    const uncategorizedCount = computed(
      () =>
        counterparties.value.filter((c) => !c.categoryIds || c.categoryIds.length === 0)
          .length,
    );

    watch(
      currentUser,
      (user, previousUser) => {
        if (user) {
          if (previousUser && previousUser.id !== user.id) resetStore();
          load({ userId: user.id });
        } else if (previousUser) {
          resetStore();
        }
      },
      { immediate: true },
    );

    return {
      categories,
      counterparties,
      isLoading,
      loaded,
      uncategorizedCount,
      load,
      refresh,
      refreshCurrent,
      resetStore,
    };
  },
);
