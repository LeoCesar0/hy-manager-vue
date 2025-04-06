<script setup lang="ts">
import { cn } from "~/lib/utils";

type Props = {
  alt: string;
  src?: string | undefined | null;
  fallBackLabel?: string;
  size?: "sm" | "lg" | "base" | null | undefined;
  variant?: "accent" | "muted";
  class?: string;
};

const props = withDefaults(defineProps<Props>(), {
  variant: "muted",
});
</script>

<template>
  <UiAvatar
    :class="
      cn(props.class || '', {
        'bg-muted': variant === 'muted',
      })
    "
    :size="size"
  >
    <UiAvatarImage :alt="alt" :src="src || ''" />
    <UiAvatarFallback
      v-if="fallBackLabel"
      class="text-lg bg-transparent"
      :class="{
        'text-muted-foreground': variant === 'muted',
      }"
      >{{ fallBackLabel.charAt(0).toUpperCase() }}</UiAvatarFallback
    >
  </UiAvatar>
</template>

<style lang="scss" scoped></style>
