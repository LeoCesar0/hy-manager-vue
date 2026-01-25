<script setup lang="ts">
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";
import { deleteBankAccount } from "~/services/api/bank-accounts/delete-bank-account";
import BankAccountCard from "~/components/BankAccounts/BankAccountCard.vue";
import { useAlertDialog } from "~/composables/ui/useAlertDialog";

definePageMeta({
  layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const bankAccounts = ref<IBankAccount[]>([]);
const loading = ref(false);

const loadBankAccounts = async () => {
  if (!currentUser.value) return;

  loading.value = true;
  const result = await getBankAccounts({
    userId: currentUser.value.id,
  });
  loading.value = false;

  if (result.data) {
    bankAccounts.value = result.data.list;
  }
};

const handleEdit = (bankAccount: IBankAccount) => {
  navigateTo(`/dashboard/bank-accounts/${bankAccount.id}`);
};

const handleDelete = async (bankAccount: IBankAccount) => {
  const confirmed = await useAlertDialog().confirm({
    title: "Delete Bank Account",
    description: `Are you sure you want to delete "${bankAccount.name}"? This action cannot be undone.`,
  });

  if (!confirmed) return;

  const result = await deleteBankAccount(bankAccount.id);

  if (result.error) {
    console.error("Error deleting bank account:", result.error);
    return;
  }

  await loadBankAccounts();
};

onMounted(() => {
  loadBankAccounts();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Bank Accounts</h1>
        <p class="text-muted-foreground">Manage your bank accounts</p>
      </div>
      <UiButton @click="navigateTo('/dashboard/bank-accounts/new')">
        Add Bank Account
      </UiButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <div v-else-if="bankAccounts.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No bank accounts yet.</p>
      <UiButton class="mt-4" @click="navigateTo('/dashboard/bank-accounts/new')">
        Add Your First Account
      </UiButton>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <BankAccountCard
        v-for="account in bankAccounts"
        :key="account.id"
        :bank-account="account"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>
