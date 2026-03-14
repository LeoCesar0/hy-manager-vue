import { vi } from "vitest";

/**
 * Individual mock functions for all Firebase CRUD operations.
 * Import and use these directly in `vi.mock()` calls at the top level of your test files.
 *
 * Usage in test files:
 * ```ts
 * import { firebaseMocks } from "../helpers/mock-firebase";
 *
 * vi.mock("~/services/firebase/firebaseCreate", () => ({
 *   firebaseCreate: firebaseMocks.firebaseCreate,
 * }));
 *
 * // In your test:
 * firebaseMocks.firebaseCreate.mockResolvedValue(fakeTransaction);
 * ```
 *
 * Or for quick setup, copy the `vi.mock()` block from `FIREBASE_MOCK_SETUP`
 * into your test file's top level.
 */
export const firebaseMocks = {
  firebaseCreate: vi.fn(),
  firebaseGet: vi.fn(),
  firebaseList: vi.fn(),
  firebaseUpdate: vi.fn(),
  firebaseDelete: vi.fn(),
  firebaseGetWhere: vi.fn(),
  firebaseCreateMany: vi.fn(),
  firebaseUpdateMany: vi.fn(),
  firebaseDeleteMany: vi.fn(),
  firebaseBatchDelete: vi.fn(),
  firebaseBatchUpdate: vi.fn(),
  firebasePaginatedList: vi.fn(),
  firebaseUpsertData: vi.fn(),
};

export type FirebaseMocks = typeof firebaseMocks;

/**
 * Resets all firebase mocks. Call in `beforeEach` to ensure clean state.
 */
export const resetFirebaseMocks = () => {
  Object.values(firebaseMocks).forEach((mock) => mock.mockReset());
};

/**
 * Copy-paste this block into the top level of your test file to mock all Firebase services:
 *
 * ```ts
 * import { firebaseMocks } from "../helpers/mock-firebase";
 *
 * vi.mock("~/services/firebase/firebaseCreate", () => ({ firebaseCreate: firebaseMocks.firebaseCreate }));
 * vi.mock("~/services/firebase/firebaseGet", () => ({ firebaseGet: firebaseMocks.firebaseGet }));
 * vi.mock("~/services/firebase/firebaseList", () => ({ firebaseList: firebaseMocks.firebaseList }));
 * vi.mock("~/services/firebase/firebaseUpdate", () => ({ firebaseUpdate: firebaseMocks.firebaseUpdate }));
 * vi.mock("~/services/firebase/firebaseDelete", () => ({ firebaseDelete: firebaseMocks.firebaseDelete }));
 * vi.mock("~/services/firebase/firebaseGetWhere", () => ({ firebaseGetWhere: firebaseMocks.firebaseGetWhere }));
 * vi.mock("~/services/firebase/firebaseCreateMany", () => ({ firebaseCreateMany: firebaseMocks.firebaseCreateMany }));
 * vi.mock("~/services/firebase/firebaseUpdateMany", () => ({ firebaseUpdateMany: firebaseMocks.firebaseUpdateMany }));
 * vi.mock("~/services/firebase/firebaseDeleteMany", () => ({ firebaseDeleteMany: firebaseMocks.firebaseDeleteMany }));
 * vi.mock("~/services/firebase/firebaseBatchDelete", () => ({ firebaseBatchDelete: firebaseMocks.firebaseBatchDelete }));
 * vi.mock("~/services/firebase/firebasePaginatedList", () => ({ firebasePaginatedList: firebaseMocks.firebasePaginatedList }));
 * vi.mock("~/services/firebase/firebaseUpsertData", () => ({ firebaseUpsertData: firebaseMocks.firebaseUpsertData }));
 * ```
 */
