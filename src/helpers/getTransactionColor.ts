type IProps = {
  type: 'deposit' | 'expense';
};

export const getTransactionColor = ({ type }: IProps) => {
  return type === 'deposit'
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
};
