<script setup lang="ts">
import { cn } from "~/lib/utils";

type Props = {
  class?: string;
};

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('flex py-2 items-center gap-4 justify-end', props.class)">
    <slot />
  </div>
</template>
