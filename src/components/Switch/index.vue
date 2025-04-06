<script setup lang="ts">
import { cn } from "~/lib/utils";

/* 
  use v-model like this v-model:checked="includeUserInAverage"
 */

type Props = {
  placeholder?: string;
  containerProps?: Record<string, any>;
  label?: string;
  class?: string;
  labelInfo?: string;
};

const props = withDefaults(defineProps<Props>(), {});
</script>

<template>
  <div
    :class="cn('w-full max-w-[250px]', props.class)"
    v-bind="{
      ...containerProps,
    }"
  >
    <UiLabel v-if="label" class="mb-2" :labelInfo="labelInfo">
      {{ label }}
    </UiLabel>
    <UiSwitch v-bind="$attrs" />
  </div>
</template>
