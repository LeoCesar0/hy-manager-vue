<script setup lang="ts">
import { TrendingUpIcon } from "lucide-vue-next";

type IProps = {
  size?: "sm" | "md";
};

withDefaults(defineProps<IProps>(), {
  size: "sm",
});
</script>

<template>
  <TrendingUpIcon
    class="text-deposit shrink-0"
    :class="size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'"
  />
</template>
