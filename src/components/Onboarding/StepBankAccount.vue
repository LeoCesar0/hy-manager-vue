<script setup lang="ts">
import { WalletIcon, ArrowLeftIcon } from "lucide-vue-next";

type IProps = {
  onNext: (bankAccountName: string) => void;
  onBack: () => void;
};

const props = defineProps<IProps>();

const bankAccountName = ref("");
const error = ref("");

const handleNext = () => {
  const trimmed = bankAccountName.value.trim();
  if (!trimmed) {
    error.value = "Por favor, informe o nome da conta";
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
        <WalletIcon class="h-8 w-8 text-primary" />
      </div>
      <h2 class="text-2xl font-semibold">Conta Bancária</h2>
      <p class="text-muted-foreground">
        Crie sua primeira conta bancária para começar a gerenciar suas finanças.
      </p>
    </div>

    <div class="space-y-2">
      <label for="onboarding-bank" class="text-sm font-medium">Nome da conta</label>
      <UiInput
        id="onboarding-bank"
        v-model="bankAccountName"
        placeholder="Ex: Nubank, Itaú, Bradesco..."
        @keydown.enter="handleNext"
      />
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    </div>

    <div class="flex gap-3">
      <UiButton variant="outline" class="flex-1" @click="onBack">
        <ArrowLeftIcon class="h-4 w-4 mr-1" />
        Voltar
      </UiButton>
      <UiButton class="flex-1" @click="handleNext">
        Continuar
      </UiButton>
    </div>
  </div>
</template>
