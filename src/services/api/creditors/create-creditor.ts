import type {
  ICreditor,
  ICreateCreditor,
} from "~/@schemas/models/creditor";
import type { AppResponse } from "~/@schemas/app";

export const createCreditor = async (
  data: ICreateCreditor
): Promise<AppResponse<ICreditor>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelCreate<ICreateCreditor, ICreditor>({
    collection: "creditors",
    data,
  });
};
