type IProps<T> = {
  items: T[];
  size: number;
};

export const chunk = <T>({ items, size }: IProps<T>): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};
