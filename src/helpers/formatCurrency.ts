type IProps = {
  amount: number;
};

export const formatCurrency = ({ amount }: IProps) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};
