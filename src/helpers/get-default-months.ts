type IProps = {
  count: number;
};

// Returns the last `count` month keys ("YYYY-MM"), oldest first, ending at the
// current month. Used to seed report/category period selectors with a sensible
// default window (e.g. "last 6 months").
export const getDefaultMonths = ({ count }: IProps): string[] => {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
};
