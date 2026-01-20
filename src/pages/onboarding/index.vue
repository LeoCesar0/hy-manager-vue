<script setup lang="ts">
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";
import { UiButton } from "~/components/ui/button";
import ProgressIndicator from "~/components/Onboarding/ProgressIndicator.vue";

const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <UiCard class="w-full max-w-2xl">
      <UiCardHeader>
        <ProgressIndicator :current-step="1" :total-steps="3" />
        <UiCardTitle class="text-3xl text-center mt-4">
          Welcome to Your Finance Manager
        </UiCardTitle>
        <UiCardDescription class="text-center text-lg">
          Let's set up your account in just a few steps
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="space-y-6">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="text-2xl">🏦</div>
            <div>
              <h3 class="font-semibold">Set up bank accounts</h3>
              <p class="text-sm text-muted-foreground">
                Add your bank accounts to track money across different sources
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="text-2xl">📁</div>
            <div>
              <h3 class="font-semibold">Create categories</h3>
              <p class="text-sm text-muted-foreground">
                Organize your transactions with custom categories
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="text-2xl">💰</div>
            <div>
              <h3 class="font-semibold">Start tracking</h3>
              <p class="text-sm text-muted-foreground">
                Begin adding transactions and manage your finances
              </p>
            </div>
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <UiButton variant="outline" @click="router.push('/dashboard')">
            Skip for now
          </UiButton>
          <UiButton @click="router.push('/onboarding/bank-accounts')">
            Get Started
          </UiButton>
        </div>
      </UiCardContent>
    </UiCard>
  </div>
</template>
