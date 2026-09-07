import { roundCurrency } from "~/helpers/roundCurrency";

type IProps = {
  values: number[];
};

// Median of a numeric series. Empty input → 0. Even count → average of the two
// middle values; odd count → the middle value. Sorts a copy, so the caller's
// array is never mutated. Zeros are real values here: a fixed-window series with
// many empty months will pull the median down on purpose.
export const calculateMedian = ({ values }: IProps): number => {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;

  return roundCurrency({ value: median });
};
