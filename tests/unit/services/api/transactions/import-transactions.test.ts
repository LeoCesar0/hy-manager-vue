import { beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import { firebaseMocks, resetFirebaseMocks } from "../../../../helpers/mock-firebase";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { IBankStatementRow } from "~/services/csv-import/@types";

vi.mock("~/services/firebase/firebaseList", () => ({
  firebaseList: firebaseMocks.firebaseList,
}));
vi.mock("~/services/firebase/firebaseCreateMany", () => ({
  firebaseCreateMany: firebaseMocks.firebaseCreateMany,
}));
vi.mock("~/services/api/reports/update-report-bulk", () => ({
  updateReportBulk: vi.fn(),
}));

import { importTransactions } from "~/services/api/transactions/import-transactions";

const USER_ID = "user-1";
const BANK_ID = "bank-1";

const buildRow = (overrides: Partial<IBankStatementRow> = {}): IBankStatementRow => ({
  id: "inter-2026-01-15-expense-10.00-padaria-0",
  date: new Date("2026-01-15T12:00:00Z"),
  amount: 10,
  type: "expense",
  description: "Compra no débito - Padaria",
  counterpartyName: "Padaria",
  ...overrides,
});

const buildExistingTx = (overrides: Partial<ITransaction> = {}): ITransaction =>
  ({
    id: "inter-2026-01-15-expense-10.00-padaria-0",
    type: "expense",
    amount: 10,
    description: "Compra no débito - Padaria",
    date: Timestamp.fromDate(new Date("2026-01-15T12:00:00Z")),
    categoryIds: [],
    counterpartyId: null,
    userId: USER_ID,
    bankAccountId: BANK_ID,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  }) as ITransaction;

/**
 * Routes firebaseList by collection so each query type returns the right data:
 * transactions -> existing tx in range (dedup), creditors -> existing
 * counterparties, categories -> user categories.
 */
const stubLists = ({
  transactions = [] as ITransaction[],
  creditors = [] as ICounterparty[],
  categories = [] as unknown[],
} = {}) => {
  firebaseMocks.firebaseList.mockImplementation(
    async ({ collection }: { collection: string }) => {
      if (collection === "transactions") return transactions;
      if (collection === "creditors") return creditors;
      if (collection === "categories") return categories;
      return [];
    },
  );
};

/**
 * Echoes the created docs back, synthesizing an id for new counterparties and
 * preserving the row id for transactions — mirrors firebaseCreateMany's hydration.
 */
const stubCreateMany = () => {
  firebaseMocks.firebaseCreateMany.mockImplementation(
    async ({ collection, data }: { collection: string; data: any[] }) =>
      data.map((d, i) => ({
        ...d,
        id: d.id ?? `${collection}-gen-${i}`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })),
  );
};

const listCallsFor = (collection: string) =>
  firebaseMocks.firebaseList.mock.calls.filter(
    ([arg]) => (arg as { collection: string }).collection === collection,
  );

const createManyCallsFor = (collection: string) =>
  firebaseMocks.firebaseCreateMany.mock.calls.filter(
    ([arg]) => (arg as { collection: string }).collection === collection,
  );

const silent = {
  options: {
    toastOptions: { loading: false, success: false, error: false },
  },
} as const;

describe("importTransactions", () => {
  beforeEach(() => {
    resetFirebaseMocks();
    stubCreateMany();
  });

  it("skips rows whose id already exists and imports new ones", async () => {
    stubLists({ transactions: [buildExistingTx()] });

    const rows = [
      buildRow(), // same id as existing -> skip
      buildRow({
        id: "inter-2026-02-20-deposit-50.00-salario-0",
        date: new Date("2026-02-20T12:00:00Z"),
        amount: 50,
        type: "deposit",
        description: "Pix recebido - Salário",
        counterpartyName: "Salário",
      }),
    ];

    const res = await importTransactions({
      rows,
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });

    expect(res.data?.created).toHaveLength(1);
    expect(res.data?.skipped).toBe(1);
    expect(res.data?.created[0]?.id).toBe("inter-2026-02-20-deposit-50.00-salario-0");
  });

  it("#3: deduplicates with a single transactions query (no per-id chunked queries)", async () => {
    stubLists({ transactions: [] });

    const rows = Array.from({ length: 90 }, (_, i) =>
      buildRow({
        id: `inter-2026-01-15-expense-10.00-padaria-${i}`,
        description: `Compra no débito - Padaria ${i}`,
        counterpartyName: `Padaria ${i}`,
      }),
    );

    await importTransactions({
      rows,
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });

    // 90 rows would have meant ceil(90/30)=3 chunked id queries before;
    // now it must be exactly one ranged read.
    expect(listCallsFor("transactions")).toHaveLength(1);
  });

  it("#3 fallback: detects duplicates by fields for old-format ids (count-based)", async () => {
    // Existing tx imported under an old id format, same fields as a new-format row.
    const existing = buildExistingTx({ id: "old-format-xyz" });
    stubLists({ transactions: [existing] });

    const rows = [
      // new-format id, but same (date,type,amount,description) -> field match -> skip
      buildRow(),
      // a genuine second occurrence of the same transaction -> only one existed,
      // so the second copy is created
      buildRow({ id: "inter-2026-01-15-expense-10.00-padaria-1" }),
    ];

    const res = await importTransactions({
      rows,
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });

    expect(res.data?.skipped).toBe(1);
    expect(res.data?.created).toHaveLength(1);
  });

  it("#2: creates all new counterparties in a single bulk call", async () => {
    stubLists({ transactions: [], creditors: [] });

    const rows = [
      buildRow({ id: "r1", counterpartyName: "Padaria", description: "d1" }),
      buildRow({ id: "r2", counterpartyName: "Mercado", description: "d2" }),
      buildRow({ id: "r3", counterpartyName: "Farmácia", description: "d3" }),
    ];

    const res = await importTransactions({
      rows,
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });

    const creditorCalls = createManyCallsFor("creditors");
    expect(creditorCalls).toHaveLength(1);
    expect((creditorCalls[0]![0] as { data: unknown[] }).data).toHaveLength(3);

    // every created transaction got a counterpartyId resolved from the bulk create
    expect(res.data?.created).toHaveLength(3);
    for (const tx of res.data!.created) {
      expect(tx.counterpartyId).toBeTruthy();
    }
  });

  it("reuses existing counterparties instead of recreating them", async () => {
    const existingCp = {
      id: "cp-existing",
      name: "Padaria",
      categoryIds: ["cat-1"],
      userId: USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as unknown as ICounterparty;

    stubLists({ transactions: [], creditors: [existingCp] });

    const rows = [
      buildRow({ id: "r1", counterpartyName: "Padaria", description: "d1" }),
      buildRow({ id: "r2", counterpartyName: "Mercado", description: "d2" }),
    ];

    const res = await importTransactions({
      rows,
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });

    const creditorCalls = createManyCallsFor("creditors");
    expect(creditorCalls).toHaveLength(1);
    // only the unknown "Mercado" is created; "Padaria" is reused
    expect((creditorCalls[0]![0] as { data: unknown[] }).data).toHaveLength(1);

    const padariaTx = res.data?.created.find((t) => t.id === "r1");
    expect(padariaTx?.counterpartyId).toBe("cp-existing");
    expect(padariaTx?.categoryIds).toEqual(["cat-1"]);
  });

  it("handles rows with no counterpartyName (counterpartyId null) and empty input", async () => {
    stubLists({ transactions: [], creditors: [] });

    const empty = await importTransactions({
      rows: [],
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });
    expect(empty.data?.created).toHaveLength(0);
    expect(empty.data?.skipped).toBe(0);

    const res = await importTransactions({
      rows: [buildRow({ id: "r1", counterpartyName: null, description: "no cp" })],
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });
    expect(res.data?.created).toHaveLength(1);
    expect(res.data?.created[0]?.counterpartyId).toBeNull();
    // no counterparties to create
    expect(createManyCallsFor("creditors")).toHaveLength(0);
  });

  it("skips entirely when all rows already exist", async () => {
    stubLists({ transactions: [buildExistingTx()] });

    const res = await importTransactions({
      rows: [buildRow()],
      userId: USER_ID,
      bankAccountId: BANK_ID,
      ...silent,
    });

    expect(res.data?.created).toHaveLength(0);
    expect(res.data?.skipped).toBe(1);
    // no transactions written
    expect(createManyCallsFor("transactions")).toHaveLength(0);
  });
});
