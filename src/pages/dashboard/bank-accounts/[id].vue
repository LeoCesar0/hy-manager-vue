<script setup lang="ts">
import type { IBankAccount, IUpdateBankAccount } from "~/@schemas/models/bank-account";
import { updateBankAccount } from "~/services/api/bank-accounts/update-bank-account";
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

const route = useRoute();
const router = useRouter();
const firebaseStore = useFirebaseStore();

const bankAccountId = route.params.id as string;
const bankAccount = ref<IBankAccount | null>(null);
const loading = ref(false);
const loadingData = ref(false);

const loadBankAccount = async () => {
  loadingData.value = true;
  const result = await firebaseStore.modelGet<IBankAccount>({
    collection: "bankAccounts",
    id: bankAccountId,
  });
  loadingData.value = false;

  if (result.data) {
    bankAccount.value = result.data;
  }
};

const handleSubmit = async (data: IUpdateBankAccount) => {
  loading.value = true;
  const result = await updateBankAccount(bankAccountId, data);
  loading.value = false;

  if (result.error) {
    console.error("Error updating bank account:", result.error);
    return;
  }

  router.push("/dashboard/bank-accounts");
};

const handleCancel = () => {
  router.push("/dashboard/bank-accounts");
};

onMounted(() => {
  loadBankAccount();
});
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Edit Bank Account</h1>
      <p class="text-muted-foreground">Update your bank account details</p>
    </div>

    <div v-if="loadingData" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <UiCard v-else-if="bankAccount">
      <UiCardHeader>
        <UiCardTitle>Account Details</UiCardTitle>
        <UiCardDescription>Update the name of your bank account</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <BankAccountForm
          :bank-account="bankAccount"
          :loading="loading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </UiCardContent>
    </UiCard>
  </div>
</template>
