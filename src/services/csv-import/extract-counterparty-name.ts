type IProps = {
  description: string;
};

export const extractCounterpartyName = ({
  description,
}: IProps): string | null => {
  const parts = description.split(" - ");

  if (parts.length < 2) {
    return null;
  }

  const name = parts[1]?.trim();
  return name || null;
};
