import { beforeEach, describe, expect, it, vi } from "vitest";
import { firebaseMocks, resetFirebaseMocks } from "../../../../helpers/mock-firebase";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { slugify } from "~/helpers/slugify";

vi.mock("~/services/firebase/firebaseList", () => ({
  firebaseList: firebaseMocks.firebaseList,
}));
vi.mock("~/services/firebase/firebaseCreate", () => ({
  firebaseCreate: firebaseMocks.firebaseCreate,
}));

import { getOrCreateCounterparty } from "~/services/api/counterparties/get-or-create-counterparty";

const USER_ID = "user-1";

const silent = {
  options: { toastOptions: { loading: false, success: false, error: false } },
} as const;

describe("getOrCreateCounterparty", () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  it("looks up by slugifiedName with a single indexed query and reuses the match", async () => {
    const existing = {
      id: "cp-1",
      name: "Padaria Y",
      slugifiedName: "padaria-y",
      categoryIds: ["cat-1"],
      userId: USER_ID,
    } as unknown as ICounterparty;
    firebaseMocks.firebaseList.mockResolvedValue([existing]);

    const res = await getOrCreateCounterparty({
      name: "Padaria Y",
      userId: USER_ID,
      ...silent,
    });

    expect(res.data?.id).toBe("cp-1");
    // exactly one query, filtered by userId AND slugifiedName
    expect(firebaseMocks.firebaseList).toHaveBeenCalledTimes(1);
    const filters = firebaseMocks.firebaseList.mock.calls[0]![0].filters;
    expect(filters).toEqual(
      expect.arrayContaining([
        { field: "userId", operator: "==", value: USER_ID },
        { field: "slugifiedName", operator: "==", value: slugify("Padaria Y") },
      ]),
    );
    // no create on a hit
    expect(firebaseMocks.firebaseCreate).not.toHaveBeenCalled();
  });

  it("creates a new counterparty (with slugifiedName) on a miss", async () => {
    firebaseMocks.firebaseList.mockResolvedValue([]);
    firebaseMocks.firebaseCreate.mockImplementation(async ({ data }: { data: any }) => ({
      ...data,
      id: "cp-new",
    }));

    const res = await getOrCreateCounterparty({
      name: "Novo Lugar",
      userId: USER_ID,
      categoryIds: ["cat-9"],
      ...silent,
    });

    expect(res.data?.id).toBe("cp-new");
    expect(firebaseMocks.firebaseCreate).toHaveBeenCalledTimes(1);
    const created = firebaseMocks.firebaseCreate.mock.calls[0]![0].data;
    expect(created.slugifiedName).toBe(slugify("Novo Lugar"));
    expect(created.categoryIds).toEqual(["cat-9"]);
  });
});
