<script setup lang="ts">
import { cn } from "~/lib/utils";

export type AvatarProps = {
  alt: string;
  src?: string | undefined | null;
  fallBackLabel?: string;
  size?: "sm" | "lg" | "xl" | "base" | null | undefined;
  variant?: "accent" | "muted";
  class?: string;
  hoverable?: boolean;
};

const props = withDefaults(defineProps<AvatarProps>(), {
  variant: "muted",
});
const fallBack = computed(() => props.fallBackLabel || props.alt || "");
</script>

<template>
  <UiAvatar
    :class="
      cn(props.class || '', {
        'bg-muted': variant === 'muted',
        'hover:cursor-pointer hover:shadow-lg transition-all duration-300': hoverable,
      })
    "
    :size="size"
  >
    <UiAvatarImage :alt="alt" :src="src || ''" class="object-cover" />
    <UiAvatarFallback
      v-if="fallBack"
      class="bg-transparent"
      :class="{
        'text-muted-foreground': variant === 'muted',
      }"
      >{{ fallBack.charAt(0).toUpperCase() }}</UiAvatarFallback
    >
  </UiAvatar>
</template>

<style lang="scss" scoped></style>
