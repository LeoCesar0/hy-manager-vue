import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";

export const calculateCategorySplits = (
  transactions: ITransaction[],
  categories: ICategory[]
) => {
  const totals: Record<string, number> = {};
  let grandTotal = 0;

  transactions.forEach((transaction) => {
    if (transaction.categorySplits && transaction.categorySplits.length > 0) {
      transaction.categorySplits.forEach((split) => {
        if (!totals[split.categoryId]) {
          totals[split.categoryId] = 0;
        }
        totals[split.categoryId] += Math.abs(split.amount);
        grandTotal += Math.abs(split.amount);
      });
    } else if (transaction.categoryId) {
      if (!totals[transaction.categoryId]) {
        totals[transaction.categoryId] = 0;
      }
      totals[transaction.categoryId] += Math.abs(transaction.amount);
      grandTotal += Math.abs(transaction.amount);
    }
  });

  return Object.entries(totals).map(([categoryId, amount]) => {
    const category = categories.find((c) => c.id === categoryId);
    return {
      categoryId,
      categoryName: category?.name || "Unknown",
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
      color: category?.color,
    };
  });
};
