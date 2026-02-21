<script setup lang="ts">
const { isOpen } = useAlertDialog()
</script>

<template>
  <div class="min-h-screen flex flex-col relative">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <GlobalAlertDialog />
  </div>
</template>
