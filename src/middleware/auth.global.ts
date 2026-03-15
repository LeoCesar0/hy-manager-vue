import { onAuthStateChanged } from "firebase/auth";
import { handleInitializeUser } from "~/services/api/@handlers/handle-initialize-user";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/esqueci-minha-senha"];

export default defineNuxtRouteMiddleware(async (to) => {
  const firebaseStore = useFirebaseStore();
  const userStore = useUserStore();
  const { currentUser } = storeToRefs(userStore);

  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      firebaseStore.firebaseAuth,
      async (firebaseUser) => {
        firebaseStore.currentFirebaseUser = firebaseUser;
        if (firebaseUser && currentUser.value?.id !== firebaseUser.uid) {
          const res = await handleInitializeUser({ user: firebaseUser });
          currentUser.value = res.data;
        }
        if (!firebaseUser) {
          currentUser.value = null;
        }
        unsubscribe();
        resolve();
      }
    );
  });

  const isAuthRoute = AUTH_ROUTES.includes(to.path);
  const isDashboardRoute = to.path.startsWith("/dashboard");

  if (!currentUser.value && isDashboardRoute) {
    return navigateTo("/sign-in");
  }

  if (currentUser.value && isAuthRoute) {
    return navigateTo("/dashboard");
  }
});
