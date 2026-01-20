import type {
  IBankAccount,
  IUpdateBankAccount,
} from "~/@schemas/models/bank-account";
import type { AppResponse } from "~/@schemas/app";

export const updateBankAccount = async (
  id: string,
  data: IUpdateBankAccount
): Promise<AppResponse<IBankAccount>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelUpdate<IUpdateBankAccount, IBankAccount>({
    collection: "bankAccounts",
    id,
    data,
  });
};
