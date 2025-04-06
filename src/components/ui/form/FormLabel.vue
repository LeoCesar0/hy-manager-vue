<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import type { LabelProps } from "radix-vue";
import { useFormField } from "./useFormField";
import { cn } from "@/lib/utils";

const props = defineProps<
  LabelProps & { class?: HTMLAttributes["class"]; labelInfo?: string }
>();

const { error, formItemId } = useFormField();
</script>

<template>
  <UiLabel
    :class="cn(error && 'text-destructive-foreground', props.class)"
    :for="formItemId"
    :labelInfo="labelInfo"
  >
    <slot />
  </UiLabel>
</template>
