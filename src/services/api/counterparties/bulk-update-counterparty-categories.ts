import { handleAppRequest } from "../@handlers/handle-app-request";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IAPIRequestCommon } from "../@types";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { slugify } from "~/helpers/slugify";
import { cascadeUpdateCounterpartyCategoryIds } from "../sync/cascade-update-counterparty-category-ids";
import { rebuildReport } from "../reports/rebuild-report";

export type IBulkCounterpartyCategoryUpdate = {
  id: string;
  name: string;
  oldCategoryIds: string[];
  newCategoryIds: string[];
};

export type IBulkUpdateCounterpartyCategoriesResult = {
  successIds: string[];
  failedIds: string[];
};

export type IAPIBulkUpdateCounterpartyCategories = {
  userId: string;
  updates: IBulkCounterpartyCategoryUpdate[];
} & IAPIRequestCommon<IBulkUpdateCounterpartyCategoriesResult>;

/**
 * Categorizes many counterparties in one pass. Each counterparty's categoryIds
 * are propagated to its transactions, but the per-account Report is rebuilt
 * ONCE for the whole batch — not once per counterparty.
 *
 * The categorize screen previously saved N counterparties via N parallel
 * `updateCounterparty` calls, each cascading its own `rebuildReport`. When
 * several counterparties shared a bank account, that account's report (a
 * fetch-all + synchronous reduce over every transaction in the account) was
 * rebuilt concurrently once per counterparty, freezing the UI. See observation
 * counterparties/performance/2026-06-16-categorizar-save-freeze.
 */
export const bulkUpdateCounterpartyCategories = async ({
  userId,
  updates,
  options,
}: IAPIBulkUpdateCounterpartyCategories) => {
  return handleAppRequest(
    async (): Promise<IBulkUpdateCounterpartyCategoriesResult> => {
      const affectedBankAccountIds = new Set<string>();
      const successIds: string[] = [];
      const failedIds: string[] = [];

      const results = await Promise.allSettled(
        updates.map(async (update) => {
          const data: Partial<ICounterparty> = {
            name: update.name,
            categoryIds: update.newCategoryIds,
            slugifiedName: slugify(update.name),
          };

          await firebaseUpdate<ICounterparty>({
            collection: "creditors",
            id: update.id,
            data,
          });

          const accounts = await cascadeUpdateCounterpartyCategoryIds({
            counterpartyId: update.id,
            oldCategoryIds: update.oldCategoryIds,
            newCategoryIds: update.newCategoryIds,
            userId,
            rebuildReports: false,
          });

          return { id: update.id, accounts };
        })
      );

      results.forEach((result, index) => {
        const update = updates[index];
        if (!update) return;
        if (result.status === "fulfilled") {
          successIds.push(result.value.id);
          result.value.accounts.forEach((id) => affectedBankAccountIds.add(id));
        } else {
          failedIds.push(update.id);
        }
      });

      // Rebuild each affected report once, sequentially — the dedupe + serialize
      // that removes the freeze.
      for (const bankAccountId of affectedBankAccountIds) {
        await rebuildReport({
          userId,
          bankAccountId,
          options: { toastOptions: undefined },
        });
      }

      return { successIds, failedIds };
    },
    {
      toastOptions: undefined,
      ...options,
    }
  );
};
