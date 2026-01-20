<script setup lang="ts">
import type { ITransaction, IUpdateTransaction } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import type { ICreditor } from "~/@schemas/models/creditor";
import type { IBankAccount } from "~/@schemas/models/bank-account";
import { updateTransaction } from "~/services/api/transactions/update-transaction";
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

const route = useRoute();
const router = useRouter();
const firebaseStore = useFirebaseStore();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const transactionId = route.params.id as string;
const transaction = ref<ITransaction | null>(null);
const loading = ref(false);
const loadingData = ref(false);
const bankAccounts = ref<IBankAccount[]>([]);
const categories = ref<ICategory[]>([]);
const creditors = ref<ICreditor[]>([]);

const loadTransaction = async () => {
  loadingData.value = true;
  const result = await firebaseStore.modelGet<ITransaction>({
    collection: "transactions",
    id: transactionId,
  });
  loadingData.value = false;

  if (result.data) {
    transaction.value = result.data;
  }
};

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

const handleSubmit = async (data: IUpdateTransaction, creditorName?: string) => {
  loading.value = true;
  const result = await updateTransaction(transactionId, data, creditorName);
  loading.value = false;

  if (result.error) {
    console.error("Error updating transaction:", result.error);
    return;
  }

  router.push("/dashboard/transactions");
};

const handleCancel = () => {
  router.push("/dashboard/transactions");
};

onMounted(() => {
  loadTransaction();
  loadMetadata();
});
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Edit Transaction</h1>
      <p class="text-muted-foreground">Update your transaction details</p>
    </div>

    <div v-if="loadingData" class="text-center py-8">
      <p>Loading...</p>
    </div>

    <Card v-else-if="transaction">
      <CardHeader>
        <CardTitle>Transaction Details</CardTitle>
        <CardDescription>Update the details of your transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionForm
          :transaction="transaction"
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
