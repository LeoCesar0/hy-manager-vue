import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import type { IUser } from "~/@schemas/models/user";
import { makeStoreKey } from "~/helpers/makeStoreKey";

export const useUserStore = defineStore(makeStoreKey("user"), () => {
  const currentUser = ref<IUser | null>(null);

  const { toast } = useToast();

  const router = useRouter();
  const firebaseStore = useFirebaseStore();

  const loading = ref(false);

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      loading.value = true;
      await signInWithEmailAndPassword(
        firebaseStore.firebaseAuth,
        email,
        password
      );
      toast.success("Successfully signed in!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      loading.value = false;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      loading.value = true;
      await signInWithPopup(
        firebaseStore.firebaseAuth,
        new GoogleAuthProvider()
      );
      toast.success("Successfully signed in with Google!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      loading.value = false;
    }
  };

  return {
    currentUser,
    loading,
    handleEmailSignIn,
    handleGoogleSignIn,
  };
});
