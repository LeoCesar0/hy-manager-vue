import { ref, computed, type Ref } from "vue";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { ICursorPaginationResult } from "~/services/api/transactions/paginate-transactions";

type ICursor = QueryDocumentSnapshot<DocumentData> | null;

type IFetchPageArgs = {
  cursor: ICursor;
  page: number;
};

// Vue APIs are imported explicitly (not relying on Nuxt auto-import) so this
// composable can be unit-tested by importing it directly, without the Nuxt
// runtime. Explicit imports coexist with auto-import in the app build.
type IProps<T> = {
  fetchPage: (args: IFetchPageArgs) => Promise<ICursorPaginationResult<T> | null>;
  // When true, navigation falls back to offset paging (the search result set is
  // already bounded and paginates in memory), so the cursor stack is ignored.
  isSearchMode: Ref<boolean>;
};

/**
 * Cursor-based pagination state machine (Next/Previous only). `cursorStack[p]`
 * holds the `startAfter` cursor needed to load page `p` (page 1 = null). The
 * page is intentionally not synced to the URL — a Firestore cursor isn't
 * restorable from a query param.
 *
 * The caller supplies `fetchPage`, which closes over the active filters and
 * issues the real request; this composable owns only the page index, the cursor
 * bookkeeping, and the loading flag.
 */
export const useCursorPagination = <T>({ fetchPage, isSearchMode }: IProps<T>) => {
  const list = ref<T[]>([]) as Ref<T[]>;
  const pageIndex = ref(1);
  const cursorStack = ref<ICursor[]>([]);
  const hasNext = ref(false);
  const count = ref(0);
  const isLoading = ref(false);
  // Stays false until the first fetch settles, so the full-page loader only
  // shows on the initial load — not on every filter-triggered reload.
  const initialized = ref(false);

  const hasPrev = computed(() => pageIndex.value > 1);

  const runFetch = async (args: IFetchPageArgs) => {
    isLoading.value = true;
    try {
      return await fetchPage(args);
    } finally {
      isLoading.value = false;
    }
  };

  const applyResult = (data: ICursorPaginationResult<T>) => {
    list.value = data.list;
    count.value = data.count;
    hasNext.value = data.hasNext;
  };

  // Reset to page 1 — used on mount and whenever filters/sort/account/page-size
  // change. Also the entry point when toggling search on/off (rebuilds the stack).
  const reload = async () => {
    pageIndex.value = 1;
    cursorStack.value = [];
    cursorStack.value[1] = null;

    const data = await runFetch({ cursor: null, page: 1 });
    initialized.value = true;
    if (!data) {
      list.value = [];
      count.value = 0;
      hasNext.value = false;
      return;
    }
    applyResult(data);
    if (!isSearchMode.value) cursorStack.value[2] = data.cursor;
  };

  const navigate = async (target: number) => {
    const cursor = isSearchMode.value ? null : cursorStack.value[target] ?? null;
    const data = await runFetch({ cursor, page: target });
    if (!data) return;
    applyResult(data);
    if (!isSearchMode.value) cursorStack.value[target + 1] = data.cursor;
    pageIndex.value = target;
  };

  const goNext = () => {
    if (hasNext.value) navigate(pageIndex.value + 1);
  };

  const goPrev = () => {
    if (pageIndex.value > 1) navigate(pageIndex.value - 1);
  };

  return {
    list,
    pageIndex,
    hasPrev,
    hasNext,
    count,
    isLoading,
    initialized,
    reload,
    goNext,
    goPrev,
  };
};
