<script setup lang="ts">
import type { ICreateBankAccount } from "~/@schemas/models/bank-account";
import { createBankAccount } from "~/services/api/bank-accounts/create-bank-account";
import BankAccountForm from "~/components/BankAccounts/BankAccountForm.vue";
import {
  UiCard,
  UiCardContent,
  UiCardDescription,
  UiCardHeader,
  UiCardTitle,
} from "~/components/ui/card";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();
const loading = ref(false);

const handleSubmit = async (data: ICreateBankAccount) => {
  loading.value = true;
  const result = await createBankAccount(data);
  loading.value = false;

  if (result.error) {
    console.error("Error creating bank account:", result.error);
    return;
  }

  router.push("/dashboard/bank-accounts");
};

const handleCancel = () => {
  router.push("/dashboard/bank-accounts");
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">New Bank Account</h1>
      <p class="text-muted-foreground">Add a new bank account to track your finances</p>
    </div>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Account Details</UiCardTitle>
        <UiCardDescription>Enter the name of your bank account</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <BankAccountForm :loading="loading" @submit="handleSubmit" @cancel="handleCancel" />
      </UiCardContent>
    </UiCard>
  </div>
</template>
