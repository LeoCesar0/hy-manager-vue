import { describe, it, expect, beforeEach, vi } from "vitest";
import { Timestamp } from "firebase/firestore";

const { cursorListMock, firebaseListMock } = vi.hoisted(() => ({
  cursorListMock: vi.fn(),
  firebaseListMock: vi.fn(),
}));

vi.mock("~/services/firebase/firebaseCursorList", () => ({
  firebaseCursorList: cursorListMock,
}));
vi.mock("~/services/firebase/firebaseList", () => ({
  firebaseList: firebaseListMock,
}));

import { paginateTransactions } from "~/services/api/transactions/paginate-transactions";

const USER_ID = "user-1";
const silent = {
  options: { toastOptions: { loading: false, success: false, error: false } },
} as const;

const orderBy = { field: "date", direction: "desc" as const };

describe("paginateTransactions", () => {
  beforeEach(() => {
    cursorListMock.mockReset();
    firebaseListMock.mockReset();
  });

  it("browses via the cursor service, passing the cursor through and requesting a count", async () => {
    const tx = { id: "t1", description: "Compra" };
    const lastDoc = { data: () => ({}) } as never;
    const prevCursor = { id: "cursor-prev" } as never;
    cursorListMock.mockResolvedValue({ list: [tx], hasNext: true, lastDoc, count: 73 });

    const res = await paginateTransactions({
      userId: USER_ID,
      pagination: { page: 2, limit: 20, orderBy },
      cursor: prevCursor,
      ...silent,
    });

    expect(res.data).toEqual({ list: [tx], count: 73, hasNext: true, cursor: lastDoc });
    expect(firebaseListMock).not.toHaveBeenCalled();
    expect(cursorListMock).toHaveBeenCalledTimes(1);

    const arg = cursorListMock.mock.calls[0]![0];
    expect(arg.startAfterDoc).toBe(prevCursor);
    expect(arg.limit).toBe(20);
    expect(arg.withCount).toBe(true);
    expect(arg.filters).toEqual(
      expect.arrayContaining([{ field: "userId", operator: "==", value: USER_ID }]),
    );
  });

  it("bounds an undated search to a 6-month window and filters by substring on the client", async () => {
    firebaseListMock.mockResolvedValue([
      { id: "t1", description: "Mercado X" },
      { id: "t2", description: "Salário" },
    ]);

    const res = await paginateTransactions({
      userId: USER_ID,
      search: "merc",
      pagination: { page: 1, limit: 20, orderBy },
      ...silent,
    });

    expect(cursorListMock).not.toHaveBeenCalled();

    const filters = firebaseListMock.mock.calls[0]![0].filters;
    expect(filters).toEqual(
      expect.arrayContaining([
        { field: "date", operator: ">=", value: expect.any(Timestamp) },
        { field: "date", operator: "<=", value: expect.any(Timestamp) },
      ]),
    );

    expect(res.data?.list.map((t: { description: string }) => t.description)).toEqual(["Mercado X"]);
    expect(res.data?.count).toBe(1);
    expect(res.data?.cursor).toBeNull();
  });

  it("respects an explicit date range on search and does not inject the default window", async () => {
    firebaseListMock.mockResolvedValue([]);
    const startDate = Timestamp.fromMillis(1_000_000);
    const endDate = Timestamp.fromMillis(2_000_000);

    await paginateTransactions({
      userId: USER_ID,
      search: "x",
      startDate,
      endDate,
      pagination: { page: 1, limit: 20, orderBy },
      ...silent,
    });

    const filters = firebaseListMock.mock.calls[0]![0].filters;
    expect(filters).toEqual(
      expect.arrayContaining([
        { field: "date", operator: ">=", value: startDate },
        { field: "date", operator: "<=", value: endDate },
      ]),
    );
  });
});
