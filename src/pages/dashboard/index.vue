<script setup lang="ts">
type IProps = {};
const props = withDefaults(defineProps<IProps>(), {});
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="dashboard-page">
      <h1>Dashboard</h1>
      <!-- Add your dashboard content here -->
    </div>
  </NuxtLayout>
</template>
