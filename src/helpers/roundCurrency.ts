type IProps = {
  value: number;
};

export const roundCurrency = ({ value }: IProps): number => {
  return Math.round(value * 100) / 100;
};
