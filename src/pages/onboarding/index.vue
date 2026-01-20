<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import ProgressIndicator from "~/components/Onboarding/ProgressIndicator.vue";

const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <Card class="w-full max-w-2xl">
      <CardHeader>
        <ProgressIndicator :current-step="1" :total-steps="3" />
        <CardTitle class="text-3xl text-center mt-4">
          Welcome to Your Finance Manager
        </CardTitle>
        <CardDescription class="text-center text-lg">
          Let's set up your account in just a few steps
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
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
          <Button variant="outline" @click="router.push('/dashboard')">
            Skip for now
          </Button>
          <Button @click="router.push('/onboarding/bank-accounts')">
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
