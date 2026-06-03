import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { flushPromises } from "@vue/test-utils";
import { useCursorPagination } from "~/composables/useCursorPagination";
import type { ICursorPaginationResult } from "~/services/api/transactions/paginate-transactions";

type Row = { id: string };

// The machine treats cursors as opaque tokens (it stores and replays them but
// never inspects them), so a plain string sentinel cast through `unknown` stands
// in for a real QueryDocumentSnapshot.
const cursorToken = (id: string) =>
  id as unknown as ICursorPaginationResult<Row>["cursor"];

const makeResult = (
  over: Partial<ICursorPaginationResult<Row>> = {}
): ICursorPaginationResult<Row> => ({
  list: [{ id: "x" }],
  count: 100,
  hasNext: true,
  cursor: cursorToken("c1"),
  ...over,
});

describe("useCursorPagination", () => {
  it("reload fetches page 1 with a null cursor and seeds state", async () => {
    const fetchPage = vi.fn().mockResolvedValue(
      makeResult({ list: [{ id: "a" }], count: 42, hasNext: true })
    );
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({ cursor: null, page: 1 });
    expect(m.pageIndex.value).toBe(1);
    expect(m.list.value).toEqual([{ id: "a" }]);
    expect(m.count.value).toBe(42);
    expect(m.hasNext.value).toBe(true);
    expect(m.hasPrev.value).toBe(false);
    expect(m.initialized.value).toBe(true);
  });

  it("browse: goNext replays the cursor captured from the previous page", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(makeResult({ cursor: cursorToken("page1-last") }))
      .mockResolvedValueOnce(makeResult({ cursor: cursorToken("page2-last") }));
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();
    m.goNext();
    await flushPromises();

    expect(fetchPage).toHaveBeenLastCalledWith({ cursor: cursorToken("page1-last"), page: 2 });
    expect(m.pageIndex.value).toBe(2);
    expect(m.hasPrev.value).toBe(true);
  });

  it("browse: goPrev to page 1 uses the null cursor", async () => {
    const fetchPage = vi.fn().mockResolvedValue(makeResult());
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();
    m.goNext();
    await flushPromises();
    expect(m.pageIndex.value).toBe(2);

    m.goPrev();
    await flushPromises();

    expect(fetchPage).toHaveBeenLastCalledWith({ cursor: null, page: 1 });
    expect(m.pageIndex.value).toBe(1);
  });

  it("goNext is a no-op when there is no next page", async () => {
    const fetchPage = vi.fn().mockResolvedValue(makeResult({ hasNext: false }));
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();
    m.goNext();
    await flushPromises();

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(m.pageIndex.value).toBe(1);
  });

  it("search mode: navigation ignores the cursor stack and pages by offset", async () => {
    const fetchPage = vi.fn().mockResolvedValue(makeResult({ cursor: null, hasNext: true }));
    const isSearchMode = ref(true);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();
    m.goNext();
    await flushPromises();

    // cursor stays null in search mode even as the page advances
    expect(fetchPage).toHaveBeenLastCalledWith({ cursor: null, page: 2 });
    expect(m.pageIndex.value).toBe(2);
  });

  it("reload after deep navigation resets the page index and stack", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(makeResult({ cursor: cursorToken("c1") }))
      .mockResolvedValueOnce(makeResult({ cursor: cursorToken("c2") }))
      // the reload call:
      .mockResolvedValueOnce(makeResult({ cursor: cursorToken("fresh") }));
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();
    m.goNext();
    await flushPromises();
    expect(m.pageIndex.value).toBe(2);

    await m.reload();

    expect(m.pageIndex.value).toBe(1);
    expect(fetchPage).toHaveBeenLastCalledWith({ cursor: null, page: 1 });

    // after reset, goNext must replay the freshly-captured page-1 cursor
    fetchPage.mockResolvedValueOnce(makeResult({ cursor: cursorToken("c2-again") }));
    m.goNext();
    await flushPromises();
    expect(fetchPage).toHaveBeenLastCalledWith({ cursor: cursorToken("fresh"), page: 2 });
  });

  it("a null fetch result clears the list without throwing", async () => {
    const fetchPage = vi.fn().mockResolvedValue(null);
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    await m.reload();

    expect(m.list.value).toEqual([]);
    expect(m.count.value).toBe(0);
    expect(m.hasNext.value).toBe(false);
    expect(m.initialized.value).toBe(true);
  });

  it("toggles isLoading around the fetch", async () => {
    let resolveFetch: (v: ICursorPaginationResult<Row>) => void = () => {};
    const fetchPage = vi.fn().mockImplementation(
      () => new Promise<ICursorPaginationResult<Row>>((res) => { resolveFetch = res; })
    );
    const isSearchMode = ref(false);
    const m = useCursorPagination<Row>({ fetchPage, isSearchMode });

    const p = m.reload();
    expect(m.isLoading.value).toBe(true);
    resolveFetch(makeResult());
    await p;
    expect(m.isLoading.value).toBe(false);
  });
});
