import { describe, it, expect } from "vitest";
import { paginateInMemory } from "~/helpers/paginate-in-memory";

type Row = { name: string; categoryIds?: string[] };

const rows: Row[] = [
  { name: "Supermercado", categoryIds: ["food"] },
  { name: "Mercado Central", categoryIds: ["food", "misc"] },
  { name: "Farmácia", categoryIds: ["health"] },
  { name: "Padaria", categoryIds: [] },
  { name: "Posto", categoryIds: ["car"] },
];

const pagination = (page: number, limit: number) => ({
  page,
  limit,
  orderBy: { field: "name", direction: "asc" as const },
});

describe("paginateInMemory", () => {
  it("filters by case-insensitive substring (matches anywhere, not just prefix)", () => {
    const res = paginateInMemory({
      items: rows,
      searchField: "name",
      search: "mercado",
      pagination: pagination(1, 10),
    });

    expect(res.list.map((r) => r.name).sort()).toEqual(["Mercado Central", "Supermercado"]);
    expect(res.count).toBe(2);
  });

  it("intersects categoryIds when provided", () => {
    const res = paginateInMemory({
      items: rows,
      searchField: "name",
      categoryIds: ["food"],
      pagination: pagination(1, 10),
    });

    expect(res.list.map((r) => r.name).sort()).toEqual(["Mercado Central", "Supermercado"]);
    expect(res.count).toBe(2);
  });

  it("sorts ascending and descending by the orderBy field", () => {
    const asc = paginateInMemory({ items: rows, searchField: "name", pagination: pagination(1, 10) });
    expect(asc.list[0]!.name).toBe("Farmácia");

    const desc = paginateInMemory({
      items: rows,
      searchField: "name",
      pagination: { page: 1, limit: 10, orderBy: { field: "name", direction: "desc" } },
    });
    expect(desc.list[0]!.name).toBe("Supermercado");
  });

  it("slices by page/limit and reports count + pages", () => {
    const page1 = paginateInMemory({ items: rows, searchField: "name", pagination: pagination(1, 2) });
    expect(page1.list).toHaveLength(2);
    expect(page1.count).toBe(5);
    expect(page1.pages).toBe(3);
    expect(page1.currentPage).toBe(1);

    const page3 = paginateInMemory({ items: rows, searchField: "name", pagination: pagination(3, 2) });
    expect(page3.list).toHaveLength(1); // last page, single leftover item
  });

  it("returns an empty page past the end without throwing", () => {
    const res = paginateInMemory({ items: rows, searchField: "name", pagination: pagination(99, 2) });
    expect(res.list).toEqual([]);
    expect(res.count).toBe(5);
  });

  it("does not mutate the source array order", () => {
    const original = [...rows];
    paginateInMemory({
      items: rows,
      searchField: "name",
      pagination: { page: 1, limit: 10, orderBy: { field: "name", direction: "desc" } },
    });
    expect(rows).toEqual(original);
  });
});
