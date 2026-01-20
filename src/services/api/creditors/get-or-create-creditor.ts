import type { ICreditor } from "~/@schemas/models/creditor";
import type { AppResponse } from "~/@schemas/app";
import { createCreditor } from "./create-creditor";

type IProps = {
  name: string;
  userId: string;
  categoryIds?: string[];
};

export const getOrCreateCreditor = async ({
  name,
  userId,
  categoryIds = [],
}: IProps): Promise<AppResponse<ICreditor>> => {
  const firebaseStore = useFirebaseStore();

  const normalizedName = name.trim().toLowerCase();

  const existingResult = await firebaseStore.modelList<ICreditor>({
    collection: "creditors",
    where: [
      {
        field: "userId",
        operator: "==",
        value: userId,
      },
    ],
  });

  if (existingResult.data) {
    const existing = existingResult.data.find(
      (c) => c.name.toLowerCase() === normalizedName
    );

    if (existing) {
      return { data: existing };
    }
  }

  return await createCreditor({
    name: name.trim(),
    userId,
    categoryIds,
  });
};
