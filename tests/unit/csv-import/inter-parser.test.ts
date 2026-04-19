import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { interParser } from "~/services/csv-import/parsers/inter-parser";

const sampleCsv = readFileSync(
  resolve(__dirname, "../../../src/assets/statement-examples/inter/inter-statement-example.csv"),
  "utf-8",
);

describe("interParser.parse", () => {
  it("parses every data row from the sample CSV", () => {
    const rows = interParser.parse({ csvText: sampleCsv });
    expect(rows).toHaveLength(15);
  });

  it("maps negative Valor to expense and positive Valor to deposit", () => {
    const rows = interParser.parse({ csvText: sampleCsv });

    const estorno = rows.find((r) => r.description.startsWith("Estorno"));
    expect(estorno).toBeDefined();
    expect(estorno!.type).toBe("deposit");
    expect(estorno!.amount).toBe(25.95);

    const aplicacao = rows.find((r) => r.description.startsWith("Aplicação"));
    expect(aplicacao).toBeDefined();
    expect(aplicacao!.type).toBe("expense");
    expect(aplicacao!.amount).toBe(500);
  });

  it("parses Brazilian thousands separator (3.000,00 → 3000)", () => {
    const rows = interParser.parse({ csvText: sampleCsv });
    const bigDeposit = rows.find((r) => r.amount === 3000);
    expect(bigDeposit).toBeDefined();
    expect(bigDeposit!.type).toBe("deposit");
    expect(bigDeposit!.description).toContain("Coriolano E Valentim Ltda");
  });

  it("combines Histórico and Descrição into the description field", () => {
    const rows = interParser.parse({ csvText: sampleCsv });
    const pixRecebido = rows.find((r) =>
      r.description.startsWith("Pix recebido - Leonardo César Ribeiro Rocha"),
    );
    expect(pixRecebido).toBeDefined();
  });

  it("cleans merchant description: collapses whitespace and strips trailing country code", () => {
    const rows = interParser.parse({ csvText: sampleCsv });
    const armazzem = rows.find(
      (r) => r.counterpartyName === "Armazzem Do Seu Jeito Teresina",
    );
    expect(armazzem).toBeDefined();
    expect(armazzem!.description).toBe(
      "Compra no débito - Armazzem Do Seu Jeito Teresina",
    );
  });

  it("synthesizes unique ids across same-day identical rows", () => {
    const csv = [
      " Extrato Conta Corrente ",
      "Conta ;123",
      "Período ;01/01/2026 a 02/01/2026",
      "Saldo ;0,00",
      "",
      "Data Lançamento;Histórico;Descrição;Valor;Saldo",
      "01/01/2026;Compra no débito;Uber Uber *trip Help.u Sp            Bra;-10,00;0,00",
      "01/01/2026;Compra no débito;Uber Uber *trip Help.u Sp            Bra;-10,00;-10,00",
    ].join("\n");

    const rows = interParser.parse({ csvText: csv });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).not.toBe(rows[1]!.id);
  });

  it("produces stable ids across overlapping statement periods", () => {
    const header = "Data Lançamento;Histórico;Descrição;Valor;Saldo";
    const sharedRow = "15/01/2026;Pix enviado;Mercado Livre                           Bra;-50,00;100,00";

    const partialCsv = [
      " Extrato Conta Corrente ",
      "Conta ;123",
      "Período ;10/01/2026 a 15/01/2026",
      "Saldo ;100,00",
      "",
      header,
      "10/01/2026;Compra no débito;Padaria Central                         Bra;-5,00;150,00",
      "12/01/2026;Compra no débito;Posto Shell                             Bra;-80,00;145,00",
      sharedRow,
    ].join("\n");

    const fullCsv = [
      " Extrato Conta Corrente ",
      "Conta ;123",
      "Período ;01/01/2026 a 31/01/2026",
      "Saldo ;200,00",
      "",
      header,
      "01/01/2026;Pix recebido;Salario                                 Bra;3000,00;3000,00",
      "05/01/2026;Compra no débito;Supermercado Extra                       Bra;-200,00;2800,00",
      "10/01/2026;Compra no débito;Padaria Central                         Bra;-5,00;150,00",
      "12/01/2026;Compra no débito;Posto Shell                             Bra;-80,00;145,00",
      sharedRow,
      "20/01/2026;Compra no débito;Farmacia Raia                           Bra;-30,00;70,00",
    ].join("\n");

    const partialRows = interParser.parse({ csvText: partialCsv });
    const fullRows = interParser.parse({ csvText: fullCsv });

    const partialIds = new Set(partialRows.map((r) => r.id));
    const fullIds = new Map(fullRows.map((r) => [r.id, r]));

    for (const row of partialRows) {
      expect(fullIds.has(row.id)).toBe(true);
    }

    const onlyInFull = fullRows.filter((r) => !partialIds.has(r.id));
    expect(onlyInFull).toHaveLength(3);
  });

  it("includes type in synthesized id to distinguish deposits from expenses", () => {
    const csv = [
      "Data Lançamento;Histórico;Descrição;Valor;Saldo",
      "01/01/2026;Pix enviado;Fulano;-100,00;0,00",
      "01/01/2026;Estorno;Fulano;100,00;100,00",
    ].join("\n");

    const rows = interParser.parse({ csvText: csv });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).toContain("expense");
    expect(rows[1]!.id).toContain("deposit");
    expect(rows[0]!.id).not.toBe(rows[1]!.id);
  });

  it("throws a clear error when the header row is missing", () => {
    const csv = [
      "not an inter statement",
      "foo;bar;baz",
      "1;2;3",
    ].join("\n");

    expect(() => interParser.parse({ csvText: csv })).toThrow(
      /Cabeçalho do extrato Inter não encontrado/,
    );
  });

  it("throws an invalid-headers error when columns are wrong", () => {
    const csv = [
      " Extrato Conta Corrente ",
      "",
      "Data Lançamento;Histórico;Valor", // missing Descrição and Saldo
      "01/01/2026;Pix enviado;-10,00",
    ].join("\n");

    expect(() => interParser.parse({ csvText: csv })).toThrow(
      /Cabeçalhos do extrato Inter inválidos/,
    );
  });

  it("throws when Valor is not a number", () => {
    const csv = [
      "Data Lançamento;Histórico;Descrição;Valor;Saldo",
      "01/01/2026;Pix enviado;Foo;abc;0,00",
    ].join("\n");

    expect(() => interParser.parse({ csvText: csv })).toThrow(/não é um número válido/);
  });

  it("throws when Data Lançamento is not a valid date", () => {
    const csv = [
      "Data Lançamento;Histórico;Descrição;Valor;Saldo",
      "not-a-date;Pix enviado;Foo;-10,00;0,00",
    ].join("\n");

    expect(() => interParser.parse({ csvText: csv })).toThrow(/não é válida/);
  });
});

describe("interParser.validateHeaders", () => {
  it("accepts the real Inter header row", () => {
    const headers = ["Data Lançamento", "Histórico", "Descrição", "Valor", "Saldo"];
    expect(interParser.validateHeaders({ headers })).toBe(true);
  });

  it("rejects a header row missing required columns", () => {
    const headers = ["Data", "Histórico", "Valor"];
    expect(interParser.validateHeaders({ headers })).toBe(false);
  });
});
