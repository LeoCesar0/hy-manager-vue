import type { AppResponse } from "~/@schemas/app";

export const deleteTransaction = async (
  id: string
): Promise<AppResponse<void>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelDelete({
    collection: "transactions",
    id,
  });
};
