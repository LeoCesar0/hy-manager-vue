<script setup lang="ts">
import { ref } from "vue";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
      password.value
    );

    if (userCredential.user) {
      const createUserService = await import("~/services/api/users/create-user");
      const result = await createUserService.createUser({
        data: {
          id: userCredential.user.uid,
          name: name.value,
          email: email.value,
          imageUrl: null,
        },
      });
      if(!result.error){
        router.push("/onboarding");
      }
    }
  } catch (err: any) {
    error.value = err.message || "Falha ao criar conta";
  } finally {
    loading.value = false;
  }
};

const { handleGoogleSignIn } = useUserStore();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl text-center">Criar Conta</CardTitle>
        <CardDescription class="text-center">
          Crie uma conta para começar a gerenciar seus finanças
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="error" class="p-3 rounded bg-red-50 text-red-600 text-sm">
          {{ error }}
        </div>

        <div class="space-y-2">
          <Label for="name">Nome</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            v-model="name"
          />
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

        <div class="space-y-2">
          <Label for="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            v-model="password"
          />
        </div>

        <div class="space-y-2">
          <Label for="confirmPassword">Confirmar Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            v-model="confirmPassword"
          />
        </div>

        <Button
          class="w-full"
          :disabled="loading || !name || !email || !password || !confirmPassword"
          @click="handleSignUp"
        >
          Criar Conta
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
          @click="handleGoogleSignIn"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            class="w-4 h-4 mr-2"
          />
          Criar Conta com Google
        </Button>
      </CardContent>
      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          Já tem uma conta?
          <router-link to="/sign-in" class="text-primary hover:underline">
            Entrar
          </router-link>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped lang="scss"></style>
