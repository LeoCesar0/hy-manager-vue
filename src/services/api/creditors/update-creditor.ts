import type {
  ICreditor,
  IUpdateCreditor,
} from "~/@schemas/models/creditor";
import type { AppResponse } from "~/@schemas/app";

export const updateCreditor = async (
  id: string,
  data: IUpdateCreditor
): Promise<AppResponse<ICreditor>> => {
  const firebaseStore = useFirebaseStore();

  return await firebaseStore.modelUpdate<IUpdateCreditor, ICreditor>({
    collection: "creditors",
    id,
    data,
  });
};
