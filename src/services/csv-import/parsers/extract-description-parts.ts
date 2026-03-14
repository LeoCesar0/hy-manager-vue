type IProps = {
  description: string;
};


/**
 * Extracts transaction description, counterparty name, and details from a Nubank statement description.
 * 
 * IMPORTANT: This function is designed specifically for use in the Nubank CSV parser,
 * as it depends on the Nubank export format ("Descrição - Nome do Estabelecimento - Detalhes...").
 * Do not use with data from other banks.
 */
export const extractDescriptionParts = ({
  description,
}: IProps) => {
  const parts = description.split(" - ");

  const [transactionDescription, counterpartyName, ...details] = parts;

  return {
    transactionDescription: transactionDescription || null,
    counterpartyName: counterpartyName || transactionDescription || null,
    details: details.join(" - ") || null,
  };
};
