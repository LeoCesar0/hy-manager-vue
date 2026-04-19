import Papa from "papaparse";
import type { IBankStatementParser, IBankStatementRow } from "../@types";

// Real Inter statement exports look like:
//
//   " Extrato Conta Corrente "
//   "Conta ;279552505"
//   "Período ;28/02/2026 a 29/03/2026"
//   "Saldo ;453,94"
//   ""
//   "Data Lançamento;Histórico;Descrição;Valor;Saldo"
//   "28/03/2026;Compra no débito;Armazzem Do Seu Jeito  Teresina      Bra;-10,99;453,94"
//
// Note: semicolon delimiter (not comma), 5 preamble rows before the header,
// Brazilian decimal format ("-10,99"), and no unique identifier per row —
// ids are synthesized via a stable composite key.
const normalize = (s: string): string =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Compare pre-normalized on both sides: the cedilla in "lançamento"
// decomposes to "c + U+0327" and the combining mark is stripped by
// normalize(), so the literal string must go through the same pipeline
// or the equality check will never match.
const EXPECTED_HEADER_CELL = normalize("data lançamento");

const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split("/").map(Number);
  const day = parts[0] ?? 0;
  const month = parts[1] ?? 0;
  const year = parts[2] ?? 0;
  return new Date(year, month - 1, day);
};

// Brazilian number format uses "." as thousands separator and "," as decimal.
// JS parseFloat can't handle it directly — strip thousands dots, swap the
// decimal comma, then parse. e.g. "-1.234,56" → "-1234.56" → -1234.56.
const parseBrazilianNumber = (raw: string): number => {
  const cleaned = raw.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
};

// Inter merchant strings often carry location padding like
// "Armazzem Do Seu Jeito  Teresina      Bra" — several spaces, a city name,
// more spaces, and a 3-letter country code. Collapse whitespace and drop the
// trailing " Bra" marker so the description reads as "Armazzem Do Seu Jeito
// Teresina".
const cleanInterDescription = (raw: string): string => {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+Bra$/i, "")
    .trim();
};

// No stable per-row id exists in Inter exports, so we compose one from the
// fields that uniquely identify a transaction. The occurrenceIndex suffix
// disambiguates same-day duplicates (e.g. two identical Uber trips) and is
// stable across different export date ranges — unlike a CSV row position,
// which shifts when the statement period changes.
const buildCompositeKey = ({
  date,
  amount,
  type,
  description,
}: {
  date: Date;
  amount: number;
  type: "expense" | "deposit";
  description: string;
}): string => {
  const iso = date.toISOString().slice(0, 10);
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${iso}-${type}-${amount.toFixed(2)}-${slug}`;
};

const synthesizeId = (compositeKey: string, occurrenceIndex: number): string => {
  return `inter-${compositeKey}-${occurrenceIndex}`;
};

export const interParser: IBankStatementParser = {
  formatKey: "inter",
  formatLabel: "Inter",
  expectedHeaders: ["data lançamento", "histórico", "descrição", "valor", "saldo"],

  validateHeaders({ headers }) {
    const normalized = headers.map(normalize);
    return this.expectedHeaders.every((h) => normalized.includes(normalize(h)));
  },

  parse({ csvText }) {
    const result = Papa.parse<string[]>(csvText, {
      header: false,
      delimiter: ";",
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new Error(`Erro ao processar CSV: ${result.errors[0]?.message}`);
    }

    // Preamble rows vary slightly between exports (account number, date
    // range, balance). Instead of hardcoding "skip first 5 rows", scan until
    // we find the real header row — more tolerant to minor format changes.
    const headerIndex = result.data.findIndex((row) => {
      if (!row || row.length === 0) return false;
      const firstCell = normalize(row[0] ?? "");
      return firstCell === EXPECTED_HEADER_CELL;
    });

    if (headerIndex === -1) {
      throw new Error(
        `Cabeçalho do extrato Inter não encontrado. Esperado uma linha começando com "Data Lançamento".`,
      );
    }

    const headerRow = result.data[headerIndex]!;
    if (!this.validateHeaders({ headers: headerRow })) {
      throw new Error(
        `Cabeçalhos do extrato Inter inválidos. Recebido: ${headerRow.join(", ")}`,
      );
    }

    const dataRows = result.data.slice(headerIndex + 1);
    const rows: IBankStatementRow[] = [];
    const occurrenceCounter = new Map<string, number>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]!;
      const [dateStr, historicoRaw, descricaoRaw, valorStr] = row as [
        string?,
        string?,
        string?,
        string?,
        string?,
      ];

      // Skip footer/summary rows that may trail the data (e.g. empty cells or
      // non-transactional totals). A valid row has at minimum a date, value,
      // and some description content.
      if (!dateStr || !valorStr || (!descricaoRaw && !historicoRaw)) {
        continue;
      }

      const valor = parseBrazilianNumber(valorStr);
      if (isNaN(valor)) {
        throw new Error(
          `Linha ${headerIndex + 2 + i}: valor "${valorStr}" não é um número válido.`,
        );
      }

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(
          `Linha ${headerIndex + 2 + i}: data "${dateStr}" não é válida. Formato esperado: DD/MM/AAAA.`,
        );
      }

      const historico = (historicoRaw ?? "").trim();
      const descricao = cleanInterDescription(descricaoRaw ?? "");
      // Combine Histórico (operation type: "Pix enviado", "Compra no débito",
      // "Aplicação", "Estorno") with the merchant description so users see
      // both the kind of transaction and who it was with.
      const description = historico && descricao
        ? `${historico} - ${descricao}`
        : (descricao || historico);

      const amount = Math.abs(valor);
      const type = valor < 0 ? "expense" : "deposit" as const;
      const descForId = descricao || historico;
      const compositeKey = buildCompositeKey({ date, amount, type, description: descForId });
      const occurrenceIndex = occurrenceCounter.get(compositeKey) ?? 0;
      occurrenceCounter.set(compositeKey, occurrenceIndex + 1);

      rows.push({
        id: synthesizeId(compositeKey, occurrenceIndex),
        date,
        amount,
        type,
        description,
        counterpartyName: descricao || null,
      });
    }

    return rows;
  },
};
