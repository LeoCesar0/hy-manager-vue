<script setup lang="ts">
import { SunIcon, MoonIcon } from "lucide-vue-next";

const store = useDarkModeStore();

const { isDark } = storeToRefs(store);
</script>

<template>
  <UiButton size="icon" variant="outline" @click="store.toggleDarkMode">
    <SunIcon v-if="isDark" />
    <MoonIcon v-if="!isDark" />
  </UiButton>
</template>
