import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import type { IUser } from "~/@schemas/models/user";
import { makeStoreKey } from "~/helpers/makeStoreKey";
import { handleAppRequest } from "~/services/api/@handlers/handle-app-request";

export const useUserStore = defineStore(makeStoreKey("user"), () => {
  const currentUser = ref<IUser | null>(null);

  const router = useRouter();
  const firebaseStore = useFirebaseStore();
  const { currentFirebaseUser } = storeToRefs(firebaseStore);

  const loading = ref(false);

  const handleEmailSignIn = async (email: string, password: string) => {
    await handleAppRequest(
      () =>
        signInWithEmailAndPassword(firebaseStore.firebaseAuth, email, password),
      {
        loadingRefs: [loading],
        toastOptions: {
          loading: { message: "Signing in..." },
          success: { message: "Successfully signed in!" },
          error: { message: "Failed to sign in" },
        },
        onSuccess: () => {
          router.push("/");
        },
      }
    );
  };

  const handleGoogleSignIn = async () => {
    await handleAppRequest(
      () =>
        signInWithPopup(firebaseStore.firebaseAuth, new GoogleAuthProvider()),
      {
        loadingRefs: [loading],
        toastOptions: {
          loading: { message: "Signing in with Google..." },
          success: { message: "Successfully signed in with Google!" },
          error: { message: "Failed to sign in with Google" },
        },
        onSuccess: () => {
          router.push("/");
        },
      }
    );
  };

  return {
    currentUser,
    loading,
    handleEmailSignIn,
    handleGoogleSignIn,
  };
});
