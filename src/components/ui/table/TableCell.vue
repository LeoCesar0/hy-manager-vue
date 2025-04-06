<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    truncate?: boolean;
  }>(),
  {
    truncate: true,
  }
);
</script>

<template>
  <td
    :class="
      cn(
        'p-2 px-4 align-middle  max-w-[200px] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        props.class,
        {
          truncate: !!truncate,
        }
      )
    "
  >
    <slot />
  </td>
</template>
