<script setup lang="ts">
import { ref } from "vue";
import { sendPasswordResetEmail } from "firebase/auth";
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
const loading = ref(false);
const error = ref("");
const success = ref(false);

const firebaseStore = useFirebaseStore();

const handleResetPassword = async () => {
  error.value = "";
  success.value = false;

  if (!email.value) {
    error.value = "Please enter your email";
    return;
  }

  loading.value = true;

  try {
    await sendPasswordResetEmail(firebaseStore.firebaseAuth, email.value);
    success.value = true;
  } catch (err: any) {
    error.value = err.message || "Falha ao enviar link de redefinição de senha";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl text-center">Redefinir Senha</CardTitle>
        <CardDescription class="text-center">
          Insira seu email para receber um link de redefinição de senha
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="error" class="p-3 rounded bg-red-50 text-red-600 text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="p-3 rounded bg-green-50 text-green-600 text-sm">
          Link de redefinição de senha enviado! Verifique sua caixa de entrada.
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            v-model="email"
          />
        </div>

        <Button
          class="w-full"
          :disabled="loading || !email"
          @click="handleResetPassword"
        >
          Enviar Link de Redefinição de Senha
        </Button>
      </CardContent>
      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          Lembrou sua senha?
          <router-link to="/sign-in" class="text-primary hover:underline">
            Entrar
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped lang="scss"></style>
