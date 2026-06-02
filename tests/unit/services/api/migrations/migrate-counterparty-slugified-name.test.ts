import { beforeEach, describe, expect, it, vi } from "vitest";
import { firebaseMocks, resetFirebaseMocks } from "../../../../helpers/mock-firebase";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IUser } from "~/@schemas/models/user";
import { slugify } from "~/helpers/slugify";

vi.mock("~/services/firebase/firebaseList", () => ({
  firebaseList: firebaseMocks.firebaseList,
}));
vi.mock("~/services/firebase/firebaseUpdateMany", () => ({
  firebaseUpdateMany: firebaseMocks.firebaseUpdateMany,
}));
const { updateUserMock } = vi.hoisted(() => ({ updateUserMock: vi.fn() }));
vi.mock("~/services/api/users/update-user", () => ({
  updateUser: updateUserMock,
}));

import { migrateCounterpartySlugifiedName } from "~/services/api/migrations/migrate-counterparty-slugified-name";

const buildUser = (overrides: Partial<IUser> = {}): IUser =>
  ({ id: "user-1", name: "Leo", email: "a@b.com", ...overrides }) as IUser;

const cp = (id: string, name: string, slugifiedName?: string): ICounterparty =>
  ({ id, name, slugifiedName, categoryIds: [], userId: "user-1" }) as unknown as ICounterparty;

describe("migrateCounterpartySlugifiedName", () => {
  beforeEach(() => {
    resetFirebaseMocks();
    updateUserMock.mockReset();
    updateUserMock.mockResolvedValue({ data: {}, error: null });
  });

  it("backfills only counterparties missing slugifiedName and marks the user", async () => {
    firebaseMocks.firebaseList.mockResolvedValue([
      cp("a", "Padaria"), // missing
      cp("b", "Mercado", "mercado"), // already has it
      cp("c", "Farmácia São"), // missing
    ]);

    await migrateCounterpartySlugifiedName({ user: buildUser() });

    expect(firebaseMocks.firebaseUpdateMany).toHaveBeenCalledTimes(1);
    const items = firebaseMocks.firebaseUpdateMany.mock.calls[0]![0].items;
    expect(items).toEqual([
      { id: "a", data: { slugifiedName: slugify("Padaria") } },
      { id: "c", data: { slugifiedName: slugify("Farmácia São") } },
    ]);

    expect(updateUserMock).toHaveBeenCalledTimes(1);
    expect(updateUserMock.mock.calls[0]![0].data).toEqual({
      migrations: { counterpartySlug: true },
    });
  });

  it("is a no-op when the user is already migrated", async () => {
    await migrateCounterpartySlugifiedName({
      user: buildUser({ migrations: { counterpartySlug: true } }),
    });

    expect(firebaseMocks.firebaseList).not.toHaveBeenCalled();
    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("marks the user even when nothing needs backfilling", async () => {
    firebaseMocks.firebaseList.mockResolvedValue([cp("b", "Mercado", "mercado")]);

    await migrateCounterpartySlugifiedName({ user: buildUser() });

    expect(firebaseMocks.firebaseUpdateMany).not.toHaveBeenCalled();
    expect(updateUserMock).toHaveBeenCalledTimes(1);
  });

  it("never throws when a write fails (login must not break)", async () => {
    firebaseMocks.firebaseList.mockRejectedValue(new Error("boom"));

    await expect(
      migrateCounterpartySlugifiedName({ user: buildUser() }),
    ).resolves.toBeUndefined();
  });
});
