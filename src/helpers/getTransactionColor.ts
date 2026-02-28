type IProps = {
  type: 'deposit' | 'expense';
};

export const getTransactionColor = ({ type }: IProps) => {
  return type === 'deposit'
    ? 'text-deposit'
    : 'text-expense';
};
