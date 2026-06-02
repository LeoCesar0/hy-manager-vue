import { onAuthStateChanged } from "firebase/auth";
import { handleInitializeUser } from "~/services/api/@handlers/handle-initialize-user";
import { migrateCounterpartySlugifiedName } from "~/services/api/migrations/migrate-counterparty-slugified-name";
import { AUTH_ROUTES } from "~/static/routes";

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
          // Awaited so the slugifiedName backfill finishes before any page or
          // store load queries counterparties (avoids duplicate creation).
          if (res.data) {
            await migrateCounterpartySlugifiedName({ user: res.data });
          }
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
  const isOnboardingRoute = to.path.startsWith("/onboarding");

  // Unauthenticated users cannot access dashboard or onboarding
  if (!currentUser.value && (isDashboardRoute || isOnboardingRoute)) {
    return navigateTo("/sign-in");
  }

  // Authenticated user who hasn't completed onboarding → redirect to onboarding
  if (currentUser.value && isDashboardRoute && !currentUser.value.hasCompletedOnboarding) {
    return navigateTo("/onboarding");
  }

  // Authenticated user who completed onboarding trying to access onboarding → redirect to dashboard
  if (currentUser.value && isOnboardingRoute && currentUser.value.hasCompletedOnboarding) {
    return navigateTo("/dashboard");
  }

  // Authenticated user on auth routes → redirect to dashboard
  if (currentUser.value && isAuthRoute) {
    return navigateTo("/dashboard");
  }
});
