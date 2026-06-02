import type { IUser } from "~/@schemas/models/user";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
import { updateUser } from "../users/update-user";
import { slugify } from "~/helpers/slugify";

const silentOptions = {
  toastOptions: { loading: false, success: false, error: false },
} as const;

/**
 * One-shot backfill: populates `slugifiedName` on existing counterparties that
 * predate the field. Runs client-side on login (awaited in auth.global.ts) so it
 * completes before getOrCreateCounterparty queries by slugifiedName — otherwise
 * an un-backfilled doc wouldn't match and a duplicate would be created.
 *
 * Idempotent: gated by `user.migrations.counterpartySlug`, and only docs still
 * missing the field are touched, so a partial run resumes safely next session.
 * Never throws — a migration failure must not block login (retries next time).
 */
export const migrateCounterpartySlugifiedName = async ({
  user,
}: {
  user: IUser;
}): Promise<void> => {
  try {
    if (user.migrations?.counterpartySlug) return;

    const counterparties = await firebaseList<ICounterparty>({
      collection: "creditors",
      filters: [{ field: "userId", operator: "==", value: user.id }],
    });

    const missing = counterparties.filter((c) => !c.slugifiedName);

    if (missing.length > 0) {
      await firebaseUpdateMany<ICounterparty>({
        collection: "creditors",
        items: missing.map((c) => ({
          id: c.id,
          data: { slugifiedName: slugify(c.name) },
        })),
      });
    }

    await updateUser({
      id: user.id,
      data: { migrations: { ...user.migrations, counterpartySlug: true } },
      options: silentOptions,
    });
  } catch (error) {
    console.error("migrateCounterpartySlugifiedName failed", error);
  }
};
