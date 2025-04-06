<script setup lang="ts">
import { cn } from "@/lib/utils";
type Props = {
  active: boolean;
};

const props = defineProps<Props>();
</script>

<template>
  <div class="flex items-center flex-start gap-2">
    <div
      class="w-4 h-4 rounded-full"
      :class="cn({ 'bg-green-400': active, 'bg-red-400': !active })"
    ></div>
    <span>{{ active ? "Active" : "Disabled" }}</span>
  </div>
</template>
