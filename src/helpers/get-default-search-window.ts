import { Timestamp } from "firebase/firestore";

const DEFAULT_SEARCH_WINDOW_MONTHS = 6;

/**
 * Bounds a text search that has no explicit date filter. Firestore has no
 * full-text/`LIKE` support, so search fetches the matching window and filters
 * by substring on the client — this caps that fetch to the last 6 months
 * (instead of the whole history) when the user hasn't set a date range.
 */
export const getDefaultSearchWindow = (): {
  startDate: Timestamp;
  endDate: Timestamp;
} => {
  const now = new Date();

  const start = new Date(now);
  start.setMonth(start.getMonth() - DEFAULT_SEARCH_WINDOW_MONTHS);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: Timestamp.fromDate(start),
    endDate: Timestamp.fromDate(end),
  };
};
