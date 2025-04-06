<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();

const appVersion = runtimeConfig.public.appVersion;

const isStaging = runtimeConfig.public.dockerComposeUsed === "staging";
const isDev = runtimeConfig.public.dockerComposeUsed === "development";
</script>

<template>
  <p class="text-sm text-muted-foreground">
    App Version: {{ appVersion }}
    <span class="text-orange-500" v-if="isStaging">Staging</span>
    <span class="text-blue-500" v-if="isDev">Dev</span>
  </p>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;
}
</style>
