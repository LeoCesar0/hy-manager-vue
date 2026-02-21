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
        'text-accent-foreground cursor-pointer transition-colors hover:text-accent-foreground/80',
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
