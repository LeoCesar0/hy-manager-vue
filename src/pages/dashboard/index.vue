<script setup lang="ts">
import type {
  IBankAccount,
  ICreateBankAccount,
} from "~/@schemas/models/bank-account";
import { getMyBankAccounts } from "~/services/api/bank-accounts/get-my-bank-accounts";

type IProps = {};
const props = withDefaults(defineProps<IProps>(), {});

const { modelCreate, modelList, modelPaginatedList } = useFirebaseStore();

const test = async () => {
  console.log("❗❗❗ test");
  const result = await modelCreate<ICreateBankAccount, IBankAccount>({
    collection: "bankAccounts",
    data: {
      name: "test 6",
      userId: "123",
    },
  });

  if (result.error) {
    console.log(`❌ Error creating bank account -->`, result.error.message);
    return;
  }

  console.log("✅ Bank account created -->", result.data);
};
const items = ref<any>(undefined);

onMounted(async () => {
  const result = await getMyBankAccounts({
    userId: "123",
  });
  console.log(`❗ result -->`, result);
  items.value = result.data;
});
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="dashboard-page">
      <h1>Dashboard</h1>
      <UiButton @click="() => test()">Test Firebase</UiButton>
      <!-- Add your dashboard content here -->
      <pre>
        {{ items }}
      </pre>
    </div>
  </NuxtLayout>
</template>
