import type {
  ICounterparty,
  ICreateCounterparty,
} from "~/@schemas/models/counterparty";
import type { AppResponse } from "~/@schemas/app";

export const createCreditor = async (
  data: ICreateCounterparty
): Promise<AppResponse<ICounterparty>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelCreate<ICreateCounterparty, ICounterparty>({
    collection: "creditors",
    data,
  });
};
