export const parseToDate = (date: string | Date | number): Date => {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
};
