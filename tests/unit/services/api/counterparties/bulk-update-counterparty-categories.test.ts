import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockFirebaseUpdate, mockCascade, mockRebuild } = vi.hoisted(() => ({
  mockFirebaseUpdate: vi.fn(),
  mockCascade: vi.fn(),
  mockRebuild: vi.fn(),
}));

vi.mock("~/services/firebase/firebaseUpdate", () => ({
  firebaseUpdate: mockFirebaseUpdate,
}));
vi.mock("~/services/api/sync/cascade-update-counterparty-category-ids", () => ({
  cascadeUpdateCounterpartyCategoryIds: mockCascade,
}));
vi.mock("~/services/api/reports/rebuild-report", () => ({
  rebuildReport: mockRebuild,
}));
// Isolate the batching logic — exercise the real callback, normalize the result.
vi.mock("~/services/api/@handlers/handle-app-request", () => ({
  handleAppRequest: async (fn: () => Promise<unknown>) => {
    try {
      return { data: await fn(), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
}));

import { bulkUpdateCounterpartyCategories } from "~/services/api/counterparties/bulk-update-counterparty-categories";

const update = (id: string, name: string, newCategoryIds: string[]) => ({
  id,
  name,
  oldCategoryIds: [],
  newCategoryIds,
});

describe("bulkUpdateCounterpartyCategories", () => {
  beforeEach(() => {
    mockFirebaseUpdate.mockReset().mockResolvedValue({});
    mockRebuild.mockReset().mockResolvedValue({ data: {}, error: null });
    mockCascade.mockReset().mockResolvedValue([]);
  });

  it("rebuilds each affected report ONCE even when counterparties share an account", async () => {
    // cp-1 -> bank-1, cp-2 -> bank-1 + bank-2, cp-3 -> bank-2
    mockCascade.mockImplementation(async ({ counterpartyId }: { counterpartyId: string }) => {
      if (counterpartyId === "cp-1") return ["bank-1"];
      if (counterpartyId === "cp-2") return ["bank-1", "bank-2"];
      return ["bank-2"];
    });

    const response = await bulkUpdateCounterpartyCategories({
      userId: "user-1",
      updates: [
        update("cp-1", "A", ["c1"]),
        update("cp-2", "B", ["c1"]),
        update("cp-3", "C", ["c2"]),
      ],
    });

    expect(response.data?.successIds).toEqual(["cp-1", "cp-2", "cp-3"]);
    // 3 counterparties touch only 2 unique accounts -> 2 rebuilds, not 4
    expect(mockRebuild).toHaveBeenCalledTimes(2);
    const rebuilt = mockRebuild.mock.calls.map((c) => c[0].bankAccountId).sort();
    expect(rebuilt).toEqual(["bank-1", "bank-2"]);
  });

  it("propagates per counterparty with rebuildReports disabled", async () => {
    mockCascade.mockResolvedValue(["bank-1"]);

    await bulkUpdateCounterpartyCategories({
      userId: "user-1",
      updates: [update("cp-1", "Mercado", ["c1"])],
    });

    expect(mockCascade).toHaveBeenCalledWith(
      expect.objectContaining({ counterpartyId: "cp-1", rebuildReports: false })
    );
    // counterparty doc updated with a derived slugifiedName
    expect(mockFirebaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "creditors",
        id: "cp-1",
        data: expect.objectContaining({ slugifiedName: "mercado" }),
      })
    );
  });

  it("reports partial failure and excludes failed counterparties' accounts", async () => {
    mockFirebaseUpdate.mockImplementation(async ({ id }: { id: string }) => {
      if (id === "cp-2") throw new Error("write failed");
      return {};
    });
    mockCascade.mockImplementation(async ({ counterpartyId }: { counterpartyId: string }) =>
      counterpartyId === "cp-1" ? ["bank-1"] : ["bank-9"]
    );

    const response = await bulkUpdateCounterpartyCategories({
      userId: "user-1",
      updates: [update("cp-1", "A", ["c1"]), update("cp-2", "B", ["c1"])],
    });

    expect(response.data?.successIds).toEqual(["cp-1"]);
    expect(response.data?.failedIds).toEqual(["cp-2"]);
    // only the surviving counterparty's account is rebuilt
    expect(mockRebuild).toHaveBeenCalledTimes(1);
    expect(mockRebuild.mock.calls[0][0].bankAccountId).toBe("bank-1");
  });
});
