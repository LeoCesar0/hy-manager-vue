export const isNullish = (value: any): value is undefined | null => {
  if (value === undefined || value === null) {
    return true;
  }

  return false;
};
