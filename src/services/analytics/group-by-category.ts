import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import { roundCurrency } from "~/helpers/roundCurrency";

export const groupByCategory = (
  transactions: ITransaction[],
  categories: ICategory[]
) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const grouped: Record<string, { name: string; amount: number; color?: string }> = {};

  const UNCATEGORIZED_ID = "uncategorized";

  transactions.forEach((transaction) => {
    if (transaction.categoryIds.length === 0) {
      if (!grouped[UNCATEGORIZED_ID]) {
        grouped[UNCATEGORIZED_ID] = {
          name: "Sem categoria",
          amount: 0,
          color: "#9CA3AF",
        };
      }

      grouped[UNCATEGORIZED_ID]!.amount = roundCurrency({ value: grouped[UNCATEGORIZED_ID]!.amount + Math.abs(transaction.amount) });
      return;
    }

    transaction.categoryIds.forEach((categoryId) => {
      const category = categoryMap.get(categoryId);
      const categoryName = category?.name || "Sem categoria";

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          name: categoryName,
          amount: 0,
          color: category?.color ?? undefined,
        };
      }

      grouped[categoryId]!.amount = roundCurrency({ value: grouped[categoryId]!.amount + Math.abs(transaction.amount) });
    });
  });

  return Object.entries(grouped)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.amount - a.amount);
};
