import { Timestamp } from "firebase/firestore";
import type { ITransaction } from "~/@schemas/models/transaction";
import type { IUser } from "~/@schemas/models/user";
import type { ICategory } from "~/@schemas/models/category";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import type { ICounterparty } from "~/@schemas/models/counterparty";
import type { ICommonDoc } from "~/@schemas/models/@common";

// ---------------------------------------------------
// Common doc fields
// ---------------------------------------------------

let counter = 0;

const makeId = (): string => {
  counter++;
  return `test-id-${counter}`;
};

const makeCommonDoc = (overrides?: Partial<ICommonDoc>): ICommonDoc => ({
  id: makeId(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
});

/**
 * Resets the auto-increment counter. Call in `beforeEach` if you need deterministic IDs.
 */
export const resetFactoryCounter = () => {
  counter = 0;
};

// ---------------------------------------------------
// Entity factories
// ---------------------------------------------------

type FactoryOverrides<T> = Partial<Omit<T, keyof ICommonDoc>> &
  Partial<ICommonDoc>;

export const makeUser = (overrides?: FactoryOverrides<IUser>): IUser => ({
  ...makeCommonDoc(overrides),
  name: "Test User",
  email: "test@example.com",
  imageUrl: null,
  hasCompletedOnboarding: true,
  ...overrides,
});

export const makeBankAccount = (
  overrides?: FactoryOverrides<IBankAccount>
): IBankAccount => ({
  ...makeCommonDoc(overrides),
  name: "Test Bank Account",
  userId: "user-1",
  ...overrides,
});

export const makeCategory = (
  overrides?: FactoryOverrides<ICategory>
): ICategory => ({
  ...makeCommonDoc(overrides),
  name: "Test Category",
  color: "#3b82f6",
  icon: "others",
  userId: "user-1",
  ...overrides,
});

export const makeTransaction = (
  overrides?: FactoryOverrides<ITransaction>
): ITransaction => ({
  ...makeCommonDoc(overrides),
  type: "expense",
  amount: 100.5,
  description: "Test Transaction",
  date: Timestamp.now(),
  categoryIds: ["cat-1"],
  counterpartyId: null,
  userId: "user-1",
  bankAccountId: "bank-1",
  ...overrides,
});

export const makeCounterparty = (
  overrides?: FactoryOverrides<ICounterparty>
): ICounterparty => ({
  ...makeCommonDoc(overrides),
  name: "Test Counterparty",
  categoryIds: ["cat-1"],
  userId: "user-1",
  ...overrides,
});
