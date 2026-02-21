<script setup lang="ts">
import clsx from "clsx";

type Props = {
  to: string;
  class?: string;
  truncate?: boolean;
};

const props = defineProps<Props>();
</script>

<template>
  <NuxtLink
    :to="props.to"
    :class="
      clsx(
        'text-primar cursor-pointer transition-colors hover:text-link/80',
        props.class,
        {
          truncate: !!props.truncate,
        }
      )
    "
    :bind="$attrs"
  >
    <slot></slot>
  </NuxtLink>
</template>
