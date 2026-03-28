import type { User } from "firebase/auth";
import { getUserById } from "../users/get-user";
import { createUser } from "../users/create-user";
import { handleAppRequest } from "./handle-app-request";
import { zCreateUser, type ICreateUser } from "~/@schemas/models/user";

type IHandleInitializeUser = {
  user: User;
};

export const handleInitializeUser = async ({ user }: IHandleInitializeUser) => {
  return handleAppRequest(
    async () => {
      const existingRes = await getUserById({
        userId: user.uid,
        options: {
          toastOptions: {
            error: false,
            loading: false,
            success: false,
          },
        },
      });
      if (existingRes.data) {
        return existingRes;
      }
      const newUserData = zCreateUser.parse({
        email: user.email,
        name: user.displayName,
        imageUrl: user.photoURL,
        id: user.uid,
        hasCompletedOnboarding: false,
      } as ICreateUser);

      const newUserResponse = await createUser({
        data: newUserData,
        options: {
          toastOptions: {
            error: false,
            loading: false,
            success: false,
          },
        },
      });
      return newUserResponse;
    },
    {
      toastOptions: {
        error: true,
        loading: false,
        success: false,
      },
    }
  );
};
