<script setup lang="ts">
import type {
  IBankAccount,
  ICreateBankAccount,
} from "~/@schemas/models/bank-account";

type IProps = {};
const props = withDefaults(defineProps<IProps>(), {});

const { firebaseCreate } = useFirebaseStore();

const test = async () => {
  console.log("❗❗❗ test");
  const result = await firebaseCreate<ICreateBankAccount, IBankAccount>({
    collection: "bankAccounts",
    data: {
      name: "test 4",
      id: "4",
    },
  });

  if (result.error) {
    console.log(`❌ Error creating bank account -->`, result.error.message);
    return;
  }

  console.log("✅ Bank account created -->", result.data);
};
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="dashboard-page">
      <h1>Dashboard</h1>
      <UiButton @click="() => test()">Test Firebase</UiButton>
      <!-- Add your dashboard content here -->
    </div>
  </NuxtLayout>
</template>
