import type { IBudget } from "~/@schemas/models/budget";
import type { IAPIRequestCommon } from "../@types";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { createBudget } from "./create-budget";

type IProps = {
  userId: string;
  bankAccountId: string;
} & IAPIRequestCommon<IBudget>;

export const getOrCreateBudget = async ({ userId, bankAccountId, options }: IProps) => {
  try {
    const data = await firebaseGet<IBudget>({
      collection: "budgets",
      id: bankAccountId,
    });

    return { data, error: null };
  } catch {
    return createBudget({
      data: {
        id: bankAccountId,
        userId,
        bankAccountId,
        monthlyExpenseLimit: null,
        monthlyIncomeGoal: null,
        categoryBudgets: [],
      },
      options,
    });
  }
};
