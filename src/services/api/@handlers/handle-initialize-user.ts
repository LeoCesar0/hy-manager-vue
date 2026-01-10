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
      console.log("👤🔍 [handleInitializeUser] Firebase user object:", user);
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
      console.log("✅ User exists in database?", !!existingRes.data);
      if (existingRes.data) {
        return existingRes;
      }
      console.log("🆕 Creating new user in database...");
      const newUserData = zCreateUser.parse({
        email: user.email,
        name: user.displayName,
        imageUrl: user.photoURL,
        id: user.uid,
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
      console.log(`❗ newUser created -->`, newUserResponse);
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
