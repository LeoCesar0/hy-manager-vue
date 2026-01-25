import type { ICounterparty } from "~/@schemas/models/counterparty";
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
}: IProps): Promise<AppResponse<ICounterparty>> => {
  const firebaseStore = useFirebaseStore();

  const normalizedName = name.trim().toLowerCase();

  const existingResult = await firebaseStore.modelList<ICounterparty>({
    collection: "creditors",
    filters: [
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
      return { data: existing, error: null };
    }
  }

  return await createCreditor({
    name: name.trim(),
    userId,
    categoryIds,
  });
};
