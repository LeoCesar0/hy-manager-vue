import { onAuthStateChanged } from "firebase/auth";
import { handleInitializeUser } from "~/services/api/@handlers/handle-initialize-user";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const firebaseStore = useFirebaseStore();
  console.log(`------------- 🟢 START SESSION MIDDLEWARE -------------`);

  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      firebaseStore.firebaseAuth,
      async (user) => {
        firebaseStore.currentFirebaseUser = user;
        if (user) {
          const res = await handleInitializeUser({ user });
          currentUser.value = res.data;
        }
        unsubscribe();
        resolve();
      }
    );
  });

  //   handleInitializeUser
});
