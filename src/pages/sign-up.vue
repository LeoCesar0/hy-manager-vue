<script setup lang="ts">
import { ref } from "vue";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_COPY } from "~/static/landing";

definePageMeta({
  layout: "auth",
});

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const firebaseStore = useFirebaseStore();
const router = useRouter();

const handleSignUp = async () => {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "As senhas não coincidem";
    return;
  }

  if (password.value.length < 6) {
    error.value = "A senha deve ter pelo menos 6 caracteres";
    return;
  }

  loading.value = true;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      firebaseStore.firebaseAuth,
      email.value,
      password.value,
    );

    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name.value,
      });
      router.push("/onboarding");
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Falha ao criar conta";
    error.value = message;
  } finally {
    loading.value = false;
  }
};

const { handleGoogleSignIn } = useUserStore();
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        {{ AUTH_COPY.signUp.title }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ AUTH_COPY.signUp.subtitle }}
      </p>
    </div>

    <div class="space-y-4">
      <div
        v-if="error"
        class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
      >
        {{ error }}
      </div>

      <div class="space-y-2">
        <Label for="name">{{ AUTH_COPY.labels.name }}</Label>
        <Input
          id="name"
          type="text"
          :placeholder="AUTH_COPY.placeholders.name"
          v-model="name"
          class="auth-input"
        />
      </div>

      <div class="space-y-2">
        <Label for="email">{{ AUTH_COPY.labels.email }}</Label>
        <Input
          id="email"
          type="email"
          :placeholder="AUTH_COPY.placeholders.email"
          v-model="email"
          class="auth-input"
        />
      </div>

      <div class="space-y-2">
        <Label for="password">{{ AUTH_COPY.labels.password }}</Label>
        <Input
          id="password"
          type="password"
          :placeholder="AUTH_COPY.placeholders.password"
          v-model="password"
          class="auth-input"
        />
      </div>

      <div class="space-y-2">
        <Label for="confirmPassword">{{
          AUTH_COPY.labels.confirmPassword
        }}</Label>
        <Input
          id="confirmPassword"
          type="password"
          :placeholder="AUTH_COPY.placeholders.confirmPassword"
          v-model="confirmPassword"
          class="auth-input"
        />
      </div>

      <UiButton
        class="w-full"
        :disabled="loading || !name || !email || !password || !confirmPassword"
        @click="handleSignUp"
      >
        {{ AUTH_COPY.signUp.submitButton }}
      </UiButton>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t border-border/50" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span
            class="bg-background/50 px-2 text-muted-foreground backdrop-blur-sm"
          >
            {{ AUTH_COPY.signUp.separator }}
          </span>
        </div>
      </div>

      <UiButton
        variant="outline"
        class="w-full auth-input"
        :disabled="loading"
        @click="handleGoogleSignIn"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          class="mr-2 h-4 w-4"
        />
        {{ AUTH_COPY.signUp.googleButton }}
      </UiButton>
    </div>

    <div class="text-center">
      <p class="text-sm text-muted-foreground">
        {{ AUTH_COPY.signUp.hasAccount }}
        <NuxtLink to="/sign-in" class="text-primary hover:underline">
          {{ AUTH_COPY.signUp.signIn }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-input {
  background: color-mix(in oklch, var(--card) 50%, transparent);
  backdrop-filter: blur(12px);
}
</style>
