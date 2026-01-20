import type { ITransaction } from "~/@schemas/models/transaction";

type GroupingPeriod = "daily" | "weekly" | "monthly";

export const groupByDate = (
  transactions: ITransaction[],
  period: GroupingPeriod = "monthly"
) => {
  const grouped: Record<
    string,
    { date: string; income: number; expenses: number }
  > = {};

  transactions.forEach((transaction) => {
    const date = transaction.date.toDate();
    let key: string;

    switch (period) {
      case "daily":
        key = date.toISOString().split("T")[0];
        break;
      case "weekly":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "monthly":
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        income: 0,
        expenses: 0,
      };
    }

    if (transaction.type === "deposit") {
      grouped[key].income += Math.abs(transaction.amount);
    } else {
      grouped[key].expenses += Math.abs(transaction.amount);
    }
  });

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
};
