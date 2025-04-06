export const uniqueArray = <T>(arr: any[]): T[] => {
  return [...new Set(arr)];
};
