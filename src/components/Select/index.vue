<script setup lang="ts">
import type { ISelectOption } from "~/@schemas/select";
import { cn } from "~/lib/utils";

type Props = {
  options: ISelectOption<any>[];
  placeholder?: string;
  triggerProps?: Record<string, any>;
  containerProps?: Record<string, any>;
  label?: string;
  initialOption?: ISelectOption<any>;
  class?: string;
  labelInfo?: string;
};

const props = withDefaults(defineProps<Props>(), {
  triggerProps: () => ({}),
});

const localOptions = computed(() => {
  if (props.initialOption) {
    return [props.initialOption, ...props.options];
  } else {
    return props.options;
  }
});
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
    <UiSelect v-bind="$attrs">
      <UiSelectTrigger
        class="w-full"
        v-bind="{
          ...triggerProps,
        }"
      >
        <UiSelectValue :placeholder="placeholder ?? ''" />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem
          v-for="option in localOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </UiSelectItem>
      </UiSelectContent>
    </UiSelect>
  </div>
</template>
