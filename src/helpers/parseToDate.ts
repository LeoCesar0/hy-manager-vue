import { Timestamp } from "firebase/firestore";

export const parseToDate = (date: string | Date | number | Timestamp): Date => {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
};
