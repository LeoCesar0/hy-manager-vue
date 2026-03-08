export type IBankStatementRow = {
  id: string;
  date: Date;
  amount: number;
  type: "deposit" | "expense";
  description: string;
  counterpartyName: string | null;
};

export type IBankStatementParser = {
  formatKey: string;
  formatLabel: string;
  expectedHeaders: string[];
  validateHeaders: (props: { headers: string[] }) => boolean;
  parse: (props: { csvText: string }) => IBankStatementRow[];
};
