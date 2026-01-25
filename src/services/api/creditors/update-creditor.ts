import type {
  ICounterparty,
  IUpdateCounterparty,
} from "~/@schemas/models/counterparty";
import type { AppResponse } from "~/@schemas/app";

export const updateCreditor = async (
  id: string,
  data: IUpdateCounterparty
): Promise<AppResponse<ICounterparty>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelUpdate<IUpdateCounterparty, ICounterparty>({
    collection: "creditors",
    id,
    data,
  });
};
