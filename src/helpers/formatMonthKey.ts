import type { Timestamp } from "firebase/firestore";

type IProps = {
  timestamp: Timestamp;
};

export const formatMonthKey = ({ timestamp }: IProps): string => {
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};
