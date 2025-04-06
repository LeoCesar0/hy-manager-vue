<script setup lang="ts">
import { firebaseCreate } from "../../services/firebase/firebaseCreate";
type IProps = {};
const props = withDefaults(defineProps<IProps>(), {});

const test = async () => {
  const data = await firebaseCreate({
    collection: "bankAccounts",
    data: {
      name: "test",
      id: "123",
    },
  });
  console.log("❗ data -->", data);
};
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="dashboard-page">
      <h1>Dashboard</h1>
      <UiButton @click="() => test()">Test</UiButton>
      <!-- Add your dashboard content here -->
    </div>
  </NuxtLayout>
</template>
