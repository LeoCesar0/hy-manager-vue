import { nubankParser } from "./parsers/nubank-parser";
import type { IBankStatementParser, IBankStatementRow } from "./@types";

const PARSERS: Record<string, IBankStatementParser> = {
  nubank: nubankParser,
};

export const AVAILABLE_FORMATS = Object.values(PARSERS).map((p) => ({
  key: p.formatKey,
  label: p.formatLabel,
}));

type IProps = {
  formatKey: string;
  csvText: string;
};

export const parseBankStatement = ({
  formatKey,
  csvText,
}: IProps): IBankStatementRow[] => {
  const parser = PARSERS[formatKey];

  if (!parser) {
    throw new Error(`Formato "${formatKey}" não é suportado.`);
  }

  return parser.parse({ csvText });
};
