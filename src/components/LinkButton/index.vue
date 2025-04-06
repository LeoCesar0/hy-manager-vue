<script setup lang="ts">
import { type IButtonProps } from "../ui/button/Button.vue";
type Props = {
  linkProps?: Record<string, any>;
  to: string;
} & IButtonProps;

const props = defineProps<Props>();
</script>

<template>
  <NuxtLink v-bind="linkProps" :to="to">
    <UiButton v-bind="$attrs">
      <slot />
    </UiButton>
  </NuxtLink>
</template>
