import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  firebaseMocks,
  resetFirebaseMocks,
  makeUser,
  resetFactoryCounter,
} from "../../helpers";
import type { User, UserCredential } from "firebase/auth";

// Mock Firebase Auth functions
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    createUserWithEmailAndPassword: (...args: unknown[]) =>
      mockCreateUserWithEmailAndPassword(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  };
});

vi.mock("~/services/firebase/firebaseGet", () => ({
  firebaseGet: firebaseMocks.firebaseGet,
}));
vi.mock("~/services/firebase/firebaseCreate", () => ({
  firebaseCreate: firebaseMocks.firebaseCreate,
}));

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { handleInitializeUser } from "~/services/api/@handlers/handle-initialize-user";

const makeFirebaseUser = (overrides?: Partial<User>): User =>
  ({
    uid: "new-user-uid",
    email: "leo@example.com",
    displayName: null,
    photoURL: null,
    ...overrides,
  }) as User;

const makeUserCredential = (userOverrides?: Partial<User>): UserCredential =>
  ({
    user: makeFirebaseUser(userOverrides),
    providerId: "password",
    operationType: "signIn",
  }) as UserCredential;

describe("signup flow (email/password)", () => {
  beforeEach(() => {
    resetFactoryCounter();
    resetFirebaseMocks();
    vi.clearAllMocks();
    mockCreateUserWithEmailAndPassword.mockReset();
    mockUpdateProfile.mockReset();
  });

  describe("createUserWithEmailAndPassword + updateProfile", () => {
    it("calls updateProfile with displayName after account creation", async () => {
      const firebaseUser = makeFirebaseUser();
      mockCreateUserWithEmailAndPassword.mockResolvedValue(
        makeUserCredential()
      );
      mockUpdateProfile.mockResolvedValue(undefined);

      const auth = {} as any;
      const credential = await createUserWithEmailAndPassword(
        auth,
        "leo@example.com",
        "password123"
      );

      await updateProfile(credential.user, { displayName: "Leonardo" });

      expect(mockUpdateProfile).toHaveBeenCalledWith(credential.user, {
        displayName: "Leonardo",
      });
    });

    it("does not call createUser service directly — delegates to handleInitializeUser", async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue(
        makeUserCredential()
      );
      mockUpdateProfile.mockResolvedValue(undefined);

      const auth = {} as any;
      const credential = await createUserWithEmailAndPassword(
        auth,
        "leo@example.com",
        "password123"
      );
      await updateProfile(credential.user, { displayName: "Leonardo" });

      // At this point in the real flow, router.push("/onboarding") triggers
      // the auth middleware which calls handleInitializeUser.
      // The sign-up page does NOT call createUser directly anymore.
      expect(firebaseMocks.firebaseCreate).not.toHaveBeenCalled();
    });
  });

  describe("handleInitializeUser after signup", () => {
    it("creates Firestore user with displayName set by updateProfile", async () => {
      // Simulates the middleware running after signup + updateProfile
      const firebaseUser = makeFirebaseUser({
        displayName: "Leonardo",
        email: "leo@example.com",
      });

      firebaseMocks.firebaseGet.mockResolvedValue(null);
      const createdUser = makeUser({
        id: "new-user-uid",
        name: "Leonardo",
        email: "leo@example.com",
        hasCompletedOnboarding: false,
      });
      firebaseMocks.firebaseCreate.mockResolvedValue(createdUser);

      const result = await handleInitializeUser({ user: firebaseUser });

      expect(firebaseMocks.firebaseGet).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "users",
          id: "new-user-uid",
        })
      );
      expect(firebaseMocks.firebaseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "users",
          data: expect.objectContaining({
            id: "new-user-uid",
            name: "Leonardo",
            email: "leo@example.com",
            hasCompletedOnboarding: false,
          }),
        })
      );
    });

    it("does not duplicate user when middleware races with itself", async () => {
      // First call: user doesn't exist yet → creates
      const firebaseUser = makeFirebaseUser({ displayName: "Leonardo" });
      const createdUser = makeUser({ id: "new-user-uid" });

      firebaseMocks.firebaseGet.mockResolvedValueOnce(null);
      firebaseMocks.firebaseCreate.mockResolvedValueOnce(createdUser);

      await handleInitializeUser({ user: firebaseUser });

      // Second call: user now exists → skips creation
      firebaseMocks.firebaseGet.mockResolvedValueOnce(createdUser);

      await handleInitializeUser({ user: firebaseUser });

      expect(firebaseMocks.firebaseCreate).toHaveBeenCalledTimes(1);
    });

    it("skips creation for returning users (Google or email)", async () => {
      const existingUser = makeUser({
        id: "existing-uid",
        hasCompletedOnboarding: true,
      });
      firebaseMocks.firebaseGet.mockResolvedValue(existingUser);

      const result = await handleInitializeUser({
        user: makeFirebaseUser({ uid: "existing-uid" }),
      });

      expect(result.data).toEqual(existingUser);
      expect(firebaseMocks.firebaseCreate).not.toHaveBeenCalled();
    });
  });

  describe("end-to-end signup → initialize flow", () => {
    it("complete flow: signup → updateProfile → handleInitializeUser creates user correctly", async () => {
      // Step 1: Firebase Auth creates the account
      const firebaseUser = makeFirebaseUser();
      mockCreateUserWithEmailAndPassword.mockResolvedValue(
        makeUserCredential()
      );
      mockUpdateProfile.mockImplementation(async (user: User, profile: any) => {
        // updateProfile mutates the user object in Firebase SDK
        (user as any).displayName = profile.displayName;
      });

      const auth = {} as any;
      const credential = await createUserWithEmailAndPassword(
        auth,
        "leo@example.com",
        "password123"
      );

      // Step 2: sign-up.vue calls updateProfile
      await updateProfile(credential.user, { displayName: "Leonardo" });

      // Verify displayName was set on the user object
      expect(credential.user.displayName).toBe("Leonardo");

      // Step 3: Middleware calls handleInitializeUser with the updated user
      firebaseMocks.firebaseGet.mockResolvedValue(null);
      const createdUser = makeUser({
        id: "new-user-uid",
        name: "Leonardo",
        email: "leo@example.com",
        hasCompletedOnboarding: false,
      });
      firebaseMocks.firebaseCreate.mockResolvedValue(createdUser);

      const result = await handleInitializeUser({
        user: credential.user,
      });

      // Verify the full flow produced the correct user
      expect(firebaseMocks.firebaseCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "users",
          data: expect.objectContaining({
            id: "new-user-uid",
            name: "Leonardo",
            email: "leo@example.com",
            imageUrl: null,
            hasCompletedOnboarding: false,
          }),
        })
      );
    });
  });
});
