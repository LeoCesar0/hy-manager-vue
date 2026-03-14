import { describe, it, expect } from "vitest";
import { extractDescriptionParts } from "~/services/csv-import/parsers/extract-description-parts";

describe("extractDescriptionParts", () => {
  it("extracts counterparty and description from delimited string", () => {
    const result = extractDescriptionParts({
      description: "Compra no débito - OUTBACK - parcela 1/3",
    });

    expect(result).toEqual({
      transactionDescription: "Compra no débito",
      counterpartyName: "OUTBACK",
      details: "parcela 1/3",
    });
  });

  it("extracts counterparty from two-part delimited string", () => {
    const result = extractDescriptionParts({
      description: "PIX - Amazon",
    });

    expect(result).toEqual({
      transactionDescription: "PIX",
      counterpartyName: "Amazon",
      details: null,
    });
  });

  it("uses full description as counterpartyName when no delimiter exists", () => {
    const result = extractDescriptionParts({
      description: "Aplicação RDB",
    });

    expect(result).toEqual({
      transactionDescription: "Aplicação RDB",
      counterpartyName: "Aplicação RDB",
      details: null,
    });
  });

  it("uses full description as counterpartyName for long descriptions without delimiter", () => {
    const result = extractDescriptionParts({
      description: "Dinheiro guardado com resgate planejado",
    });

    expect(result).toEqual({
      transactionDescription: "Dinheiro guardado com resgate planejado",
      counterpartyName: "Dinheiro guardado com resgate planejado",
      details: null,
    });
  });

  it("joins multiple detail parts with delimiter", () => {
    const result = extractDescriptionParts({
      description: "Compra no débito - OUTBACK - parcela 1/3 - cartão final 1234",
    });

    expect(result).toEqual({
      transactionDescription: "Compra no débito",
      counterpartyName: "OUTBACK",
      details: "parcela 1/3 - cartão final 1234",
    });
  });
});
