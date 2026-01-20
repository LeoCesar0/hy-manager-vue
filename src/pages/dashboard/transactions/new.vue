<script setup lang="ts">
import type { ICreateTransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICreditor } from "~/@schemas/models/creditor";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { createTransaction } from "~/services/api/transactions/create-transaction";
import { getCategories } from "~/services/api/categories/get-categories";
import { getCreditors } from "~/services/api/creditors/get-creditors";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";
import TransactionForm from "~/components/Transactions/TransactionForm.vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const loading = ref(false);
const bankAccounts = ref<IBankAccount[]>([]);
const categories = ref<ICategory[]>([]);
const creditors = ref<ICreditor[]>([]);

const loadMetadata = async () => {
  if (!currentUser.value) return;

  const [bankAccountsResult, categoriesResult, creditorsResult] = await Promise.all([
    getBankAccounts({ userId: currentUser.value.id }),
    getCategories({ userId: currentUser.value.id }),
    getCreditors({ userId: currentUser.value.id }),
  ]);

  if (bankAccountsResult.data) bankAccounts.value = bankAccountsResult.data.list;
  if (categoriesResult.data) categories.value = categoriesResult.data.list;
  if (creditorsResult.data) creditors.value = creditorsResult.data.list;
};

const handleSubmit = async (data: ICreateTransaction, creditorName?: string) => {
  loading.value = true;
  const result = await createTransaction(data, creditorName);
  loading.value = false;

  if (result.error) {
    console.error("Error creating transaction:", result.error);
    return;
  }

  router.push("/dashboard/transactions");
};

const handleCancel = () => {
  router.push("/dashboard/transactions");
};

onMounted(() => {
  loadMetadata();
});
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">New Transaction</h1>
      <p class="text-muted-foreground">Add a new transaction to track your finances</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Transaction Details</CardTitle>
        <CardDescription>Enter the details of your transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionForm
          :loading="loading"
          :bank-accounts="bankAccounts"
          :categories="categories"
          :creditors="creditors"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </CardContent>
    </Card>
  </div>
</template>
