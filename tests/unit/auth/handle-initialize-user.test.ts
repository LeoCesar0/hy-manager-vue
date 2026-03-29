import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeUser,
  makeSuccessResponse,
  makeErrorResponse,
  resetFactoryCounter,
} from "../../helpers";
import type { User } from "firebase/auth";

vi.mock("~/services/firebase/firebaseGet", () => ({
  firebaseGet: firebaseMocks.firebaseGet,
}));
vi.mock("~/services/firebase/firebaseCreate", () => ({
  firebaseCreate: firebaseMocks.firebaseCreate,
}));

import { handleInitializeUser } from "~/services/api/@handlers/handle-initialize-user";

const makeFirebaseUser = (overrides?: Partial<User>): User =>
  ({
    uid: "firebase-uid-1",
    email: "test@example.com",
    displayName: "Test User",
    photoURL: "https://example.com/photo.jpg",
    ...overrides,
  }) as User;

describe("handleInitializeUser", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    vi.clearAllMocks();
  });

  it("returns existing user without creating a new one", async () => {
    const existingUser = makeUser({ id: "firebase-uid-1" });
    firebaseMocks.firebaseGet.mockResolvedValue(existingUser);

    const result = await handleInitializeUser({
      user: makeFirebaseUser(),
    });

    expect(result.data).toEqual(existingUser);
    expect(result.error).toBeNull();
    expect(firebaseMocks.firebaseCreate).not.toHaveBeenCalled();
  });

  it("creates a new user when user does not exist in Firestore", async () => {
    firebaseMocks.firebaseGet.mockResolvedValue(null);

    const newUser = makeUser({
      id: "firebase-uid-1",
      name: "Test User",
      email: "test@example.com",
      imageUrl: "https://example.com/photo.jpg",
      hasCompletedOnboarding: false,
    });
    firebaseMocks.firebaseCreate.mockResolvedValue(newUser);

    const result = await handleInitializeUser({
      user: makeFirebaseUser(),
    });

    expect(firebaseMocks.firebaseCreate).toHaveBeenCalledOnce();
    expect(firebaseMocks.firebaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: expect.objectContaining({
          id: "firebase-uid-1",
          name: "Test User",
          email: "test@example.com",
          imageUrl: "https://example.com/photo.jpg",
          hasCompletedOnboarding: false,
        }),
      })
    );
  });

  it("uses displayName from Firebase user for name field", async () => {
    firebaseMocks.firebaseGet.mockResolvedValue(null);
    firebaseMocks.firebaseCreate.mockResolvedValue(makeUser());

    await handleInitializeUser({
      user: makeFirebaseUser({ displayName: "Leonardo Silva" }),
    });

    expect(firebaseMocks.firebaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Leonardo Silva",
        }),
      })
    );
  });

  it("sets hasCompletedOnboarding to false for new users", async () => {
    firebaseMocks.firebaseGet.mockResolvedValue(null);
    firebaseMocks.firebaseCreate.mockResolvedValue(makeUser());

    await handleInitializeUser({
      user: makeFirebaseUser(),
    });

    expect(firebaseMocks.firebaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hasCompletedOnboarding: false,
        }),
      })
    );
  });

  it("uses photoURL from Firebase user for imageUrl field", async () => {
    firebaseMocks.firebaseGet.mockResolvedValue(null);
    firebaseMocks.firebaseCreate.mockResolvedValue(makeUser());

    await handleInitializeUser({
      user: makeFirebaseUser({ photoURL: null }),
    });

    expect(firebaseMocks.firebaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imageUrl: null,
        }),
      })
    );
  });

  it("returns error when displayName is null (signup without updateProfile)", async () => {
    firebaseMocks.firebaseGet.mockResolvedValue(null);

    const result = await handleInitializeUser({
      user: makeFirebaseUser({ displayName: null }),
    });

    // Zod schema rejects null name — this ensures updateProfile must be called before
    // handleInitializeUser runs in the signup flow
    expect(result.error).not.toBeNull();
    expect(firebaseMocks.firebaseCreate).not.toHaveBeenCalled();
  });
});
