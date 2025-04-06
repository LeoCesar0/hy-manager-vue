import { STORE_KEY } from "~/static/app";

export const makeStoreKey = (key: string) => {
  return `${STORE_KEY}-${key}`;
};
