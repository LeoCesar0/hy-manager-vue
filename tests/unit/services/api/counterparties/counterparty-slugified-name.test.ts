import { beforeEach, describe, expect, it, vi } from "vitest";
import { firebaseMocks, resetFirebaseMocks } from "../../../../helpers/mock-firebase";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { slugify } from "~/helpers/slugify";

vi.mock("~/services/firebase/firebaseCreate", () => ({
  firebaseCreate: firebaseMocks.firebaseCreate,
}));
vi.mock("~/services/firebase/firebaseUpdate", () => ({
  firebaseUpdate: firebaseMocks.firebaseUpdate,
}));
vi.mock("~/services/firebase/firebaseGet", () => ({
  firebaseGet: firebaseMocks.firebaseGet,
}));
vi.mock("~/services/api/sync/cascade-update-counterparty-category-ids", () => ({
  cascadeUpdateCounterpartyCategoryIds: vi.fn(),
}));

import { createCounterparty } from "~/services/api/counterparties/create-counterparty";
import { updateCounterparty } from "~/services/api/counterparties/update-counterparty";

const USER_ID = "user-1";
const silent = {
  options: { toastOptions: { loading: false, success: false, error: false } },
} as const;

describe("counterparty writes populate slugifiedName", () => {
  beforeEach(() => {
    resetFirebaseMocks();
    firebaseMocks.firebaseCreate.mockImplementation(async ({ data }: { data: any }) => ({
      ...data,
      id: "cp-1",
    }));
    firebaseMocks.firebaseUpdate.mockImplementation(async ({ data }: { data: any }) => ({
      ...data,
      id: "cp-1",
    }));
  });

  it("createCounterparty derives slugifiedName from name", async () => {
    await createCounterparty({
      data: { name: "Mercado São João", userId: USER_ID, categoryIds: [] },
      ...silent,
    });

    const data = firebaseMocks.firebaseCreate.mock.calls[0]![0].data;
    expect(data.slugifiedName).toBe(slugify("Mercado São João"));
  });

  it("updateCounterparty recomputes slugifiedName when name changes", async () => {
    firebaseMocks.firebaseGet.mockResolvedValue({
      id: "cp-1",
      name: "Old",
      slugifiedName: "old",
      categoryIds: [],
      userId: USER_ID,
    } as unknown as ICounterparty);

    await updateCounterparty({
      id: "cp-1",
      userId: USER_ID,
      data: { name: "Padaria Nova", userId: USER_ID, categoryIds: [] },
      ...silent,
    });

    const data = firebaseMocks.firebaseUpdate.mock.calls[0]![0].data;
    expect(data.slugifiedName).toBe(slugify("Padaria Nova"));
  });
});
