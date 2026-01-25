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
        <CardTitle class="text-2xl text-center">Entrar</CardTitle>
        <CardDescription class="text-center">
          Escolha o método de entrada preferido
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
          <Label for="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Insira sua senha"
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
              Ou continue com
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
          Entrar com Google
        </Button>
      </CardContent>
      <CardFooter class="flex flex-col gap-2">
        <router-link to="/forgot-password" class="text-sm text-primary hover:underline">
          Esqueceu sua senha?
        </router-link>
        <p class="text-sm text-muted-foreground">
          Não tem uma conta?
          <router-link to="/sign-up" class="text-primary hover:underline">
            Criar Conta
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped lang="scss"></style>
