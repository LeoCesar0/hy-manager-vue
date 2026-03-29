<script setup lang="ts">
import { ref } from "vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_COPY } from "~/static/landing";

definePageMeta({
  layout: "auth",
});

const email = ref("");
const password = ref("");

const { handleEmailSignIn, handleGoogleSignIn, loading } = useUserStore();
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        {{ AUTH_COPY.signIn.title }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ AUTH_COPY.signIn.subtitle }}
      </p>
    </div>

    <div class="space-y-4">
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

      <UiButton
        class="w-full"
        :disabled="loading"
        @click="() => handleEmailSignIn(email, password)"
      >
        {{ AUTH_COPY.signIn.submitButton }}
      </UiButton>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t border-border/50" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background/50 px-2 text-muted-foreground backdrop-blur-sm">
            {{ AUTH_COPY.signIn.separator }}
          </span>
        </div>
      </div>

      <UiButton
        variant="outline"
        class="w-full auth-input"
        :disabled="loading"
        @click="() => handleGoogleSignIn()"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          class="mr-2 h-4 w-4"
        />
        {{ AUTH_COPY.signIn.googleButton }}
      </UiButton>
    </div>

    <div class="space-y-2 text-center">
      <NuxtLink
        to="/forgot-password"
        class="text-sm text-primary hover:underline"
      >
        {{ AUTH_COPY.signIn.forgotPassword }}
      </NuxtLink>
      <p class="text-sm text-muted-foreground">
        {{ AUTH_COPY.signIn.noAccount }}
        <NuxtLink to="/sign-up" class="text-primary hover:underline">
          {{ AUTH_COPY.signIn.createAccount }}
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
