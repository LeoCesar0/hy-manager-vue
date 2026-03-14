import { describe, it, expect } from "vitest";
import { resolveAutoCategoryId } from "~/services/csv-import/resolve-auto-category-id";
import type { ICategory } from "~/@schemas/models/category";

const makeCategory = (overrides: Partial<ICategory> & { id: string; name: string }): ICategory => ({
  userId: "user-1",
  color: null,
  icon: null,
  createdAt: null as any,
  updatedAt: null as any,
  ...overrides,
});

describe("resolveAutoCategoryId", () => {
  const investimentos = makeCategory({ id: "cat-inv", name: "Investimentos" });

  it("returns categoryId when counterparty matches a known pattern and user has the category", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "Aplicação RDB",
      userCategories: [investimentos],
      enableKeywordMatch: true,
    });

    expect(result).toEqual(["cat-inv"]);
  });

  it("returns empty array when counterparty matches but user has no matching category", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "Aplicação RDB",
      userCategories: [],
      enableKeywordMatch: true,
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when counterparty is not in the map", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "OUTBACK",
      userCategories: [investimentos],
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when userCategories is empty", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "Resgate RDB",
      userCategories: [],
    });

    expect(result).toEqual([]);
  });

  it("matches 'Resgate RDB' to Investimentos", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "Resgate RDB",
      userCategories: [investimentos],
      enableKeywordMatch: true,
    });

    expect(result).toEqual(["cat-inv"]);
  });

  it("matches 'Dinheiro guardado com resgate planejado' to Investimentos", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "Dinheiro guardado com resgate planejado",
      userCategories: [investimentos],
      enableKeywordMatch: true,
    });

    expect(result).toEqual(["cat-inv"]);
  });

  it("handles case variations via slugification", () => {
    const result = resolveAutoCategoryId({
      counterpartyName: "APLICAÇÃO RDB",
      userCategories: [investimentos],
      enableKeywordMatch: true,
    });

    expect(result).toEqual(["cat-inv"]);
  });

  describe("keyword fallback", () => {
    it("matches unmapped description containing 'aplicacao' keyword when enabled", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Aplicação em CDB",
        userCategories: [investimentos],
        enableKeywordMatch: true,
      });

      expect(result).toEqual(["cat-inv"]);
    });

    it("matches unmapped description containing 'resgate' keyword when enabled", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Resgate de Investimento",
        userCategories: [investimentos],
        enableKeywordMatch: true,
      });

      expect(result).toEqual(["cat-inv"]);
    });

    it("matches unmapped description containing 'dinheiro-guardado' keyword when enabled", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Dinheiro guardado automatico",
        userCategories: [investimentos],
        enableKeywordMatch: true,
      });

      expect(result).toEqual(["cat-inv"]);
    });

    it("returns empty array for keyword match when user has no matching category", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Aplicação em CDB",
        userCategories: [],
        enableKeywordMatch: true,
      });

      expect(result).toEqual([]);
    });

    it("does not match unrelated descriptions", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Pagamento de boleto",
        userCategories: [investimentos],
        enableKeywordMatch: true,
      });

      expect(result).toEqual([]);
    });

    it("does NOT keyword-match when enableKeywordMatch is false (real third party)", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Aplicação Seguros LTDA",
        userCategories: [investimentos],
        enableKeywordMatch: false,
      });

      expect(result).toEqual([]);
    });

    it("does NOT keyword-match by default", () => {
      const result = resolveAutoCategoryId({
        counterpartyName: "Aplicação em CDB",
        userCategories: [investimentos],
      });

      expect(result).toEqual([]);
    });
  });
});
