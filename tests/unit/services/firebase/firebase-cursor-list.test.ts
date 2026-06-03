import { describe, it, expect, beforeEach, vi } from "vitest";

const {
  getDocsMock,
  getCountFromServerMock,
  queryMock,
  whereMock,
  orderByMock,
  limitMock,
  startAfterMock,
  createCollectionRefMock,
} = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
  getCountFromServerMock: vi.fn(),
  queryMock: vi.fn((..._args: unknown[]) => ({ _args })),
  whereMock: vi.fn((field: string, op: string, value: unknown) => ({ __type: "where", field, op, value })),
  orderByMock: vi.fn((field: unknown, dir: unknown) => ({ __type: "orderBy", field, dir })),
  limitMock: vi.fn((n: number) => ({ __type: "limit", n })),
  startAfterMock: vi.fn((doc: unknown) => ({ __type: "startAfter", doc })),
  createCollectionRefMock: vi.fn(() => ({ __ref: "transactions" })),
}));

vi.mock("firebase/firestore", () => ({
  getDocs: getDocsMock,
  getCountFromServer: getCountFromServerMock,
  query: queryMock,
  where: whereMock,
  orderBy: orderByMock,
  limit: limitMock,
  startAfter: startAfterMock,
}));

vi.mock("~/services/firebase/createCollectionRef", () => ({
  createCollectionRef: createCollectionRefMock,
}));

import { firebaseCursorList } from "~/services/firebase/firebaseCursorList";

const fakeSnapshot = (docs: Array<Record<string, unknown>>) => ({
  docs: docs.map((d) => ({ data: () => d })),
});

const countSnapshot = (count: number) => ({ data: () => ({ count }) });

describe("firebaseCursorList", () => {
  beforeEach(() => {
    getDocsMock.mockReset();
    getCountFromServerMock.mockReset();
    queryMock.mockClear();
    limitMock.mockClear();
    startAfterMock.mockClear();
    orderByMock.mockClear();
    whereMock.mockClear();
  });

  it("fetches limit + 1 docs to detect a further page without a second query", async () => {
    getDocsMock.mockResolvedValueOnce(fakeSnapshot([{ id: "a" }, { id: "b" }]));

    await firebaseCursorList({
      collection: "transactions",
      limit: 2,
      orderBy: { field: "date", direction: "desc" },
    });

    expect(limitMock).toHaveBeenCalledWith(3);
    expect(getDocsMock).toHaveBeenCalledTimes(1);
  });

  it("flags hasNext, trims the extra doc, and returns the page's last doc as cursor", async () => {
    const docs = [{ id: "a" }, { id: "b" }, { id: "c" }]; // limit 2 + 1 overflow
    getDocsMock.mockResolvedValueOnce(fakeSnapshot(docs));

    const result = await firebaseCursorList<{ id: string }>({
      collection: "transactions",
      limit: 2,
      orderBy: { field: "date", direction: "desc" },
    });

    expect(result.hasNext).toBe(true);
    expect(result.list).toEqual([{ id: "a" }, { id: "b" }]);
    // lastDoc is the snapshot of the last item on the (trimmed) page, not the overflow doc
    expect(result.lastDoc?.data()).toEqual({ id: "b" });
  });

  it("reports hasNext false and a null-safe cursor when the page is not full", async () => {
    getDocsMock.mockResolvedValueOnce(fakeSnapshot([{ id: "a" }]));

    const result = await firebaseCursorList<{ id: string }>({
      collection: "transactions",
      limit: 5,
    });

    expect(result.hasNext).toBe(false);
    expect(result.list).toEqual([{ id: "a" }]);
    expect(result.lastDoc?.data()).toEqual({ id: "a" });
  });

  it("applies startAfter only when a cursor is provided", async () => {
    getDocsMock.mockResolvedValue(fakeSnapshot([{ id: "a" }]));

    await firebaseCursorList({ collection: "transactions", limit: 5 });
    expect(startAfterMock).not.toHaveBeenCalled();

    const cursor = { data: () => ({ id: "prev" }) } as never;
    await firebaseCursorList({ collection: "transactions", limit: 5, startAfterDoc: cursor });
    expect(startAfterMock).toHaveBeenCalledWith(cursor);
  });

  it("returns a count only when withCount is set", async () => {
    getDocsMock.mockResolvedValue(fakeSnapshot([{ id: "a" }]));
    getCountFromServerMock.mockResolvedValue(countSnapshot(42));

    const withoutCount = await firebaseCursorList({ collection: "transactions", limit: 5 });
    expect(withoutCount.count).toBeUndefined();
    expect(getCountFromServerMock).not.toHaveBeenCalled();

    const withCount = await firebaseCursorList({
      collection: "transactions",
      limit: 5,
      withCount: true,
    });
    expect(withCount.count).toBe(42);
    expect(getCountFromServerMock).toHaveBeenCalledTimes(1);
  });
});
