import type { AppResponse } from "~/@schemas/app";

export const deleteBankAccount = async (
  id: string
): Promise<AppResponse<void>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelDelete({
    collection: "bankAccounts",
    id,
  });
};
