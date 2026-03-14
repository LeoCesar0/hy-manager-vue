import type { ICounterparty } from "~/@schemas/models/counterparty";

type IProps = {
  categoryId: string;
  counterparties: ICounterparty[];
};

export const removeCategoryFromCounterparties = ({ categoryId, counterparties }: IProps): ICounterparty[] => {
  return counterparties.reduce<ICounterparty[]>((changed, counterparty) => {
    if (!counterparty.categoryIds.includes(categoryId)) return changed;

    changed.push({
      ...counterparty,
      categoryIds: counterparty.categoryIds.filter((id) => id !== categoryId),
    });

    return changed;
  }, []);
};
