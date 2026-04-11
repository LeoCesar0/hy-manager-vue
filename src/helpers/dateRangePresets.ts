import { Timestamp } from "firebase/firestore";

export type IDateRangePresetKey =
  | "this-month"
  | "last-month"
  | "last-7"
  | "last-30"
  | "last-90"
  | "this-year"
  | "custom";

export type IDateRangePreset = {
  key: IDateRangePresetKey;
  label: string;
  // Returns null for "custom" — signals the caller to leave the existing
  // start/end untouched and let the manual pickers drive the range.
  getRange: () => { start: Timestamp; end: Timestamp } | null;
};

const startOfDay = (d: Date): Date => {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
};

const endOfDay = (d: Date): Date => {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
};

const startOfMonth = (d: Date): Date => {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
};

const endOfMonth = (d: Date): Date => {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

const subtractDays = (d: Date, days: number): Date => {
  const out = new Date(d);
  out.setDate(out.getDate() - days);
  return out;
};

const toRange = (start: Date, end: Date) => ({
  start: Timestamp.fromDate(start),
  end: Timestamp.fromDate(end),
});

// Transactions FilterPanel uses Firestore Timestamps for the range inputs, so
// these helpers return Timestamps directly. All ranges are inclusive on both
// ends (startOfDay → endOfDay).
export const DATE_RANGE_PRESETS: IDateRangePreset[] = [
  {
    key: "this-month",
    label: "Este mês",
    getRange: () => {
      const now = new Date();
      return toRange(startOfMonth(now), endOfMonth(now));
    },
  },
  {
    key: "last-month",
    label: "Mês passado",
    getRange: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return toRange(startOfMonth(lastMonth), endOfMonth(lastMonth));
    },
  },
  {
    key: "last-7",
    label: "Últimos 7 dias",
    getRange: () => {
      const now = new Date();
      return toRange(startOfDay(subtractDays(now, 6)), endOfDay(now));
    },
  },
  {
    key: "last-30",
    label: "Últimos 30 dias",
    getRange: () => {
      const now = new Date();
      return toRange(startOfDay(subtractDays(now, 29)), endOfDay(now));
    },
  },
  {
    key: "last-90",
    label: "Últimos 90 dias",
    getRange: () => {
      const now = new Date();
      return toRange(startOfDay(subtractDays(now, 89)), endOfDay(now));
    },
  },
  {
    key: "this-year",
    label: "Este ano",
    getRange: () => {
      const now = new Date();
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      const end = endOfDay(new Date(now.getFullYear(), 11, 31));
      return toRange(start, end);
    },
  },
  {
    key: "custom",
    label: "Personalizado",
    getRange: () => null,
  },
];
