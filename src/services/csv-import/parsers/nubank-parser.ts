import Papa from "papaparse";
import type { IBankStatementParser, IBankStatementRow } from "../@types";
import { extractCounterpartyName } from "../extract-counterparty-name";

const EXPECTED_HEADERS = ["data", "valor", "identificador", "descricao"];

const normalizeHeader = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split("/").map(Number);
  const day = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  const year = parts[2] ?? 0;
  return new Date(year, month - 1, day);
};

export const nubankParser: IBankStatementParser = {
  formatKey: "nubank",
  formatLabel: "Nubank",
  expectedHeaders: EXPECTED_HEADERS,

  validateHeaders({ headers }) {
    const normalized = headers.map(normalizeHeader);
    return EXPECTED_HEADERS.every((h) => normalized.includes(h));
  },

  parse({ csvText }) {
    const result = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new Error(
        `Erro ao processar CSV: ${result.errors[0]?.message}`
      );
    }

    const [headerRow, ...dataRows] = result.data;

    if (!headerRow || headerRow.length === 0) {
      throw new Error("Arquivo CSV vazio ou sem cabeçalho.");
    }

    if (!this.validateHeaders({ headers: headerRow })) {
      throw new Error(
        `Cabeçalhos inválidos. Esperado: ${EXPECTED_HEADERS.join(", ")}. Recebido: ${headerRow.join(", ")}`
      );
    }

    const rows: IBankStatementRow[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]!;
      const [dateStr, valorStr, id, description] = row as [string?, string?, string?, string?];

      if (!dateStr || !valorStr || !id || !description) {
        throw new Error(
          `Linha ${i + 2} possui campos vazios.`
        );
      }

      const valor = parseFloat(valorStr);
      if (isNaN(valor)) {
        throw new Error(
          `Linha ${i + 2}: valor "${valorStr}" não é um número válido.`
        );
      }

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(
          `Linha ${i + 2}: data "${dateStr}" não é válida. Formato esperado: DD/MM/AAAA.`
        );
      }

      rows.push({
        id,
        date,
        amount: Math.abs(valor),
        type: valor < 0 ? "expense" : "deposit",
        description: description.trim(),
        counterpartyName: extractCounterpartyName({
          description: description.trim(),
        }),
      });
    }

    return rows;
  },
};
