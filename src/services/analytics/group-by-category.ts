import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";

export const groupByCategory = (
  transactions: ITransaction[],
  categories: ICategory[]
) => {
  const grouped: Record<string, { name: string; amount: number; color?: string }> = {};

  transactions.forEach((transaction) => {
    transaction.categoryIds.forEach((categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || "Sem categoria";

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          name: categoryName,
          amount: 0,
          color: category?.color ?? undefined,
        };
      }

      grouped[categoryId]!.amount += Math.abs(transaction.amount);
    });
  });

  return Object.entries(grouped)
    .map(([id, data]) => ({
      id,
      ...data,
    }))
    .sort((a, b) => b.amount - a.amount);
};
