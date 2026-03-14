import type { DefaultCategory } from "./default-categories";

export const NUBANK_AUTO_CATEGORY_MAP = new Map<string, DefaultCategory>([
]);

export const NUBANK_KEYWORD_CATEGORY_MAP: { keywords: string[]; category: DefaultCategory }[] = [
  {
    keywords: ["aplicacao", "resgate", "dinheiro-guardado"],
    category: "Investimentos",
  },
];
