import { describe, it, expect, beforeEach, vi } from "vitest";

const {
  getDocsMock,
  queryMock,
  whereMock,
  orderByMock,
  limitMock,
  startAfterMock,
  documentIdMock,
  writeBatchMock,
  mockBatches,
  createCollectionRefMock,
} = vi.hoisted(() => {
  const mockBatches: Array<{ commit: ReturnType<typeof vi.fn> }> = [];
  return {
    mockBatches,
    getDocsMock: vi.fn(),
    queryMock: vi.fn((..._args: unknown[]) => ({ _args })),
    whereMock: vi.fn((field: string, op: string, value: unknown) => ({ __type: "where", field, op, value })),
    orderByMock: vi.fn((field: unknown) => ({ __type: "orderBy", field })),
    limitMock: vi.fn((n: number) => ({ __type: "limit", n })),
    startAfterMock: vi.fn((doc: unknown) => ({ __type: "startAfter", doc })),
    documentIdMock: vi.fn(() => "__name__"),
    writeBatchMock: vi.fn(() => {
      const b = { commit: vi.fn().mockResolvedValue(undefined) };
      mockBatches.push(b);
      return b;
    }),
    createCollectionRefMock: vi.fn(() => ({ __ref: "transactions" })),
  };
});

vi.mock("firebase/firestore", () => ({
  getDocs: getDocsMock,
  query: queryMock,
  where: whereMock,
  orderBy: orderByMock,
  limit: limitMock,
  startAfter: startAfterMock,
  documentId: documentIdMock,
  writeBatch: writeBatchMock,
}));

vi.mock("~/services/firebase/createCollectionRef", () => ({
  createCollectionRef: createCollectionRefMock,
}));

vi.stubGlobal("useFirebaseStore", () => ({ firebaseDB: {} }));

import { cascadePaginatedBatch } from "~/services/firebase/cascadePaginatedBatch";

const fakeSnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  empty: docs.length === 0,
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
  })),
});

describe("cascadePaginatedBatch", () => {
  beforeEach(() => {
    mockBatches.length = 0;
    getDocsMock.mockReset();
    queryMock.mockClear();
    limitMock.mockClear();
    startAfterMock.mockClear();
    orderByMock.mockClear();
    whereMock.mockClear();
    writeBatchMock.mockClear();
  });

  it("returns early without committing when first page is empty", async () => {
    getDocsMock.mockResolvedValueOnce(fakeSnapshot([]));
    const onPage = vi.fn();

    await cascadePaginatedBatch({
      collection: "transactions",
      onPage,
    });

    expect(onPage).not.toHaveBeenCalled();
    expect(mockBatches).toHaveLength(0);
  });

  it("calls onPage once and commits once when single partial page returned", async () => {
    const docs = [{ id: "a", data: { id: "a" } }, { id: "b", data: { id: "b" } }];
    getDocsMock.mockResolvedValueOnce(fakeSnapshot(docs));

    const onPage = vi.fn();

    await cascadePaginatedBatch({
      collection: "transactions",
      pageSize: 500,
      onPage,
    });

    expect(onPage).toHaveBeenCalledTimes(1);
    expect(onPage).toHaveBeenCalledWith({
      items: [{ id: "a" }, { id: "b" }],
      batch: mockBatches[0],
    });
    expect(mockBatches).toHaveLength(1);
    expect(mockBatches[0].commit).toHaveBeenCalledTimes(1);
    expect(getDocsMock).toHaveBeenCalledTimes(1);
    expect(startAfterMock).not.toHaveBeenCalled();
  });

  it("advances the cursor and commits a batch per page when docs exceed pageSize", async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => ({
      id: `p1-${i}`,
      data: { id: `p1-${i}` },
    }));
    const page2 = [{ id: "p2-0", data: { id: "p2-0" } }];

    const snap1 = fakeSnapshot(page1);
    const snap2 = fakeSnapshot(page2);

    getDocsMock.mockResolvedValueOnce(snap1).mockResolvedValueOnce(snap2);

    const onPage = vi.fn();

    await cascadePaginatedBatch({
      collection: "transactions",
      pageSize: 2,
      onPage,
    });

    expect(onPage).toHaveBeenCalledTimes(2);
    expect(mockBatches).toHaveLength(2);
    expect(mockBatches[0].commit).toHaveBeenCalledTimes(1);
    expect(mockBatches[1].commit).toHaveBeenCalledTimes(1);

    expect(startAfterMock).toHaveBeenCalledTimes(1);
    expect(startAfterMock).toHaveBeenCalledWith(snap1.docs[snap1.docs.length - 1]);
  });

  it("exits cleanly when a follow-up page is empty", async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => ({
      id: `p1-${i}`,
      data: { id: `p1-${i}` },
    }));

    getDocsMock
      .mockResolvedValueOnce(fakeSnapshot(page1))
      .mockResolvedValueOnce(fakeSnapshot([]));

    const onPage = vi.fn();

    await cascadePaginatedBatch({
      collection: "transactions",
      pageSize: 2,
      onPage,
    });

    expect(onPage).toHaveBeenCalledTimes(1);
    expect(mockBatches).toHaveLength(1);
    expect(getDocsMock).toHaveBeenCalledTimes(2);
  });

  it("applies filters via where() and default pageSize of 500", async () => {
    getDocsMock.mockResolvedValueOnce(fakeSnapshot([]));

    await cascadePaginatedBatch({
      collection: "transactions",
      filters: [
        { field: "userId", operator: "==", value: "u-1" },
        { field: "bankAccountId", operator: "==", value: "b-1" },
      ],
      onPage: vi.fn(),
    });

    expect(whereMock).toHaveBeenCalledWith("userId", "==", "u-1");
    expect(whereMock).toHaveBeenCalledWith("bankAccountId", "==", "b-1");
    expect(limitMock).toHaveBeenCalledWith(500);
  });
});
