<script setup lang="ts">
// Dashboard layout component

const store = useUserStore();
const { currentUser } = storeToRefs(store);
</script>

<template>
  <div>
    <h1>DASHBOARD LAYOUT</h1>
    <p>currentUser: {{ currentUser?.name }}</p>
    <slot />
  </div>
</template>

<style scoped lang="scss"></style>
