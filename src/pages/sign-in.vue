<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const email = ref("");
const password = ref("");

const { handleEmailSignIn, handleGoogleSignIn, loading } = useUserStore();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl text-center">Sign In</CardTitle>
        <CardDescription class="text-center">
          Choose your preferred sign in method
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            v-model="email"
          />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            v-model="password"
          />
        </div>
        <Button
          class="w-full"
          :disabled="loading"
          @click="
            () => {
              handleEmailSignIn(email, password);
            }
          "
        >
          Sign In with Email
        </Button>
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          class="w-full"
          :disabled="loading"
          @click="
            () => {
              handleGoogleSignIn();
            }
          "
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            class="w-4 h-4 mr-2"
          />
          Sign in with Google
        </Button>
      </CardContent>
      <CardFooter class="flex flex-col gap-2">
        <router-link to="/forgot-password" class="text-sm text-primary hover:underline">
          Forgot password?
        </router-link>
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <router-link to="/sign-up" class="text-primary hover:underline">
            Sign up
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped lang="scss"></style>
