<script setup lang="ts">
import { ref } from "vue";
import { sendPasswordResetEmail } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_COPY } from "~/static/landing";

definePageMeta({
  layout: "auth",
});

const email = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

const firebaseStore = useFirebaseStore();

const handleResetPassword = async () => {
  error.value = "";
  success.value = false;

  if (!email.value) {
    error.value = "Insira seu email";
    return;
  }

  loading.value = true;

  try {
    await sendPasswordResetEmail(firebaseStore.firebaseAuth, email.value);
    success.value = true;
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Falha ao enviar link de redefinição de senha";
    error.value = message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        {{ AUTH_COPY.forgotPassword.title }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ AUTH_COPY.forgotPassword.subtitle }}
      </p>
    </div>

    <div class="space-y-4">
      <div
        v-if="error"
        class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
      >
        {{ error }}
      </div>

      <div
        v-if="success"
        class="rounded-lg bg-deposit/10 p-3 text-sm text-deposit"
      >
        {{ AUTH_COPY.forgotPassword.successMessage }}
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

      <UiButton
        class="w-full"
        :disabled="loading || !email"
        @click="handleResetPassword"
      >
        {{ AUTH_COPY.forgotPassword.submitButton }}
      </UiButton>
    </div>

    <div class="text-center">
      <p class="text-sm text-muted-foreground">
        {{ AUTH_COPY.forgotPassword.rememberPassword }}
        <NuxtLink to="/sign-in" class="text-primary hover:underline">
          {{ AUTH_COPY.forgotPassword.signIn }}
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
