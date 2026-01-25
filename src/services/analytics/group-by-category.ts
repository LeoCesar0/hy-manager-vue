import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";

export const groupByCategory = (
  transactions: ITransaction[],
  categories: ICategory[]
) => {
  const grouped: Record<string, { name: string; amount: number; color?: string }> = {};

  // TODO

  return Object.entries(grouped).map(([id, data]) => ({
    id,
    ...data,
  }));
};
