<script setup lang="ts">
import clsx from "clsx";

type Props = {
  to: string;
  class?: string;
};

const props = defineProps<Props>();
</script>

<template>
  <NuxtLink
    :to="props.to"
    :class="
      clsx(
        'text-link cursor-pointer transition-colors hover:text-link/80',
        props.class
      )
    "
    :bind="$attrs"
  >
    <slot></slot>
  </NuxtLink>
</template>
