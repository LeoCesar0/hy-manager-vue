<script setup lang="ts">
import { useFirebase } from "~/composables/useFirebase";

type IProps = {};
const props = withDefaults(defineProps<IProps>(), {});

const { create } = useFirebase();

const test = async () => {
  try {
    const data = await create({
      collection: "bankAccounts",
      data: {
        name: "test",
        id: "123",
      },
    });
    console.log("❗ data -->", data);
  } catch (error) {
    console.error("Error creating bank account:", error);
  }
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
