import type {
  IBankAccount,
  ICreateBankAccount,
} from "~/@schemas/models/bank-account";
import type { AppResponse } from "~/@schemas/app";

export const createBankAccount = async (
  data: ICreateBankAccount
): Promise<AppResponse<IBankAccount>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelCreate<ICreateBankAccount, IBankAccount>({
    collection: "bankAccounts",
    data,
  });
};
