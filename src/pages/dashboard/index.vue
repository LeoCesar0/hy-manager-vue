<script setup lang="ts">
import type {
  IBankAccount,
  ICreateBankAccount,
} from "~/@schemas/models/bank-account";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";

type IProps = {};
const props = withDefaults(defineProps<IProps>(), {});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const { modelCreate, modelList, modelPaginatedList } = useFirebaseStore();

const test = async () => {
  if (!currentUser.value) {
    console.log(`❗ NO USER FOUND -->`);
    return;
  }
  const result = await modelCreate<ICreateBankAccount, IBankAccount>({
    collection: "bankAccounts",
    data: {
      name: "test 6",
      userId: currentUser.value.id,
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
  console.log(`❗ currentUser.value -->`, currentUser.value);
  const result = await getBankAccounts({
    userId: currentUser.value?.id ?? "",
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
