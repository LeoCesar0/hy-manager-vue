<script setup lang="ts">
import { cn } from "@/lib/utils";
type Props = {
  draft: boolean;
};

const props = defineProps<Props>();
</script>

<template>
  <div class="flex items-center flex-start gap-2">
    <div
      class="w-4 h-4 rounded-full"
      :class="cn({ 'bg-blue-400': !draft, 'bg-yellow-600': !!draft })"
    ></div>
    <span>{{ draft ? "Draft" : "" }}</span>
  </div>
</template>
