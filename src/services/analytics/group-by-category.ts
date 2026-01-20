import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";

export const groupByCategory = (
  transactions: ITransaction[],
  categories: ICategory[]
) => {
  const grouped: Record<string, { name: string; amount: number; color?: string }> = {};

  transactions.forEach((transaction) => {
    if (transaction.categorySplits && transaction.categorySplits.length > 0) {
      transaction.categorySplits.forEach((split) => {
        const category = categories.find((c) => c.id === split.categoryId);
        const categoryName = category?.name || "Unknown";

        if (!grouped[split.categoryId]) {
          grouped[split.categoryId] = {
            name: categoryName,
            amount: 0,
            color: category?.color || undefined,
          };
        }

        grouped[split.categoryId]!.amount += Math.abs(split.amount);
      });
    } else if (transaction.categoryId) {
      const category = categories.find((c) => c.id === transaction.categoryId);
      const categoryName = category?.name || "Unknown";

      if (!grouped[transaction.categoryId]) {
        grouped[transaction.categoryId] = {
          name: categoryName,
          amount: 0,
          color: category?.color || undefined,
        };
      }

      grouped[transaction.categoryId]!.amount += Math.abs(transaction.amount);
    }
  });

  return Object.entries(grouped).map(([id, data]) => ({
    id,
    ...data,
  }));
};
