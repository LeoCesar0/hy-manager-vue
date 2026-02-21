import { onAuthStateChanged } from "firebase/auth";
import { handleInitializeUser } from "~/services/api/@handlers/handle-initialize-user";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const firebaseStore = useFirebaseStore();
  console.log(`------------- 🟢 START SESSION MIDDLEWARE -------------`);

  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      firebaseStore.firebaseAuth,
      async (firebaseUser) => {
        firebaseStore.currentFirebaseUser = firebaseUser;
        if (firebaseUser && currentUser.value?.id !== firebaseUser.uid) {
          const res = await handleInitializeUser({ user: firebaseUser });
          currentUser.value = res.data;
        }
        if (!firebaseUser) {
          currentUser.value = null
        }
        unsubscribe();
        resolve();
      }
    );
  });

  //   handleInitializeUser
});
