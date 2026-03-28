<script setup lang="ts">
import { UserIcon } from "lucide-vue-next";

type IProps = {
  name: string;
  onNext: (name: string) => void;
};

const props = defineProps<IProps>();

const localName = ref(props.name);
const error = ref("");

const handleNext = () => {
  const trimmed = localName.value.trim();
  if (!trimmed) {
    error.value = "Por favor, informe seu nome";
    return;
  }
  error.value = "";
  props.onNext(trimmed);
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <div class="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <UserIcon class="h-8 w-8 text-primary" />
      </div>
      <h2 class="text-2xl font-semibold">Bem-vindo!</h2>
      <p class="text-muted-foreground">
        Vamos configurar sua conta. Como devemos te chamar?
      </p>
    </div>

    <div class="space-y-2">
      <label for="onboarding-name" class="text-sm font-medium">Nome</label>
      <UiInput
        id="onboarding-name"
        v-model="localName"
        placeholder="Seu nome"
        @keydown.enter="handleNext"
      />
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    </div>

    <UiButton class="w-full" @click="handleNext">
      Continuar
    </UiButton>
  </div>
</template>
