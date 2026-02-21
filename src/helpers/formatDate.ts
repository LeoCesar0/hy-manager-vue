import { parseToDate } from "./parseToDate";
import type { Timestamp } from "firebase/firestore";

type Options = {
  time?: boolean;
  intlOptions?: Intl.DateTimeFormatOptions;
};

export const formatDate = (
  date: string | Date | number | Timestamp | undefined | null,
  { time = false, intlOptions = { dateStyle: "long" } }: Options = {}
) => {
  if (!date) return "";
  const _date = parseToDate(date);

  if (time) {
    return _date.toLocaleString("pt-BR", {
      ...intlOptions,
    });
  }
  return _date.toLocaleDateString("pt-BR", intlOptions);
};
