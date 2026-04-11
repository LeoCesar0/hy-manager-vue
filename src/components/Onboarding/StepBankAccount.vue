<script setup lang="ts">
import { WalletIcon, ArrowLeftIcon } from "lucide-vue-next";
import {
  bankAccountCompanies,
  BANK_ACCOUNT_COMPANY_LABELS,
  type IBankAccountCompany,
} from "~/@schemas/models/bank-account";

type IProps = {
  onNext: (payload: { name: string; company: IBankAccountCompany }) => void;
  onBack: () => void;
};

const props = defineProps<IProps>();

const bankAccountName = ref("");
const bankAccountCompany = ref<IBankAccountCompany>("other");
const error = ref("");

// Pre-fills the account name with the bank label when the user picks a known
// provider — matches how most people name their accounts ("Nubank", "Inter").
// Only overwrites empty/unchanged names so a user who already typed a custom
// name doesn't lose it when changing the company.
const handleSelectCompany = (company: IBankAccountCompany) => {
  const previousLabel = BANK_ACCOUNT_COMPANY_LABELS[bankAccountCompany.value];
  const nameIsAutoFilled =
    bankAccountName.value === "" || bankAccountName.value === previousLabel;

  bankAccountCompany.value = company;

  if (nameIsAutoFilled && company !== "other") {
    bankAccountName.value = BANK_ACCOUNT_COMPANY_LABELS[company];
  }
};

const handleNext = () => {
  const trimmed = bankAccountName.value.trim();
  if (!trimmed) {
    error.value = "Por favor, informe o nome da conta";
    return;
  }
  error.value = "";
  props.onNext({ name: trimmed, company: bankAccountCompany.value });
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
      <label class="text-sm font-medium">Banco</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="company in bankAccountCompanies"
          :key="company"
          type="button"
          class="rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
          :class="
            bankAccountCompany === company
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-muted-foreground/50'
          "
          @click="handleSelectCompany(company)"
        >
          {{ BANK_ACCOUNT_COMPANY_LABELS[company] }}
        </button>
      </div>
      <p class="text-xs text-muted-foreground">
        Contas de bancos não listados funcionam normalmente, mas não suportam
        importação de extrato CSV.
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
