<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import {
  useForwardPropsEmits,
  type ComboboxRootEmits,
  type ComboboxRootProps,
} from "radix-vue";
import type { HTMLAttributes } from "vue";
import { type ISelectOption } from "~/@schemas/select";

type Props = {
  options: ISelectOption[];
  placeholder?: string;
  containerProps?: Record<string, any>;
  label?: string;
  onSelectOption?: (item: ISelectOption) => void;
  class?: HTMLAttributes["class"];
  isLoading?: boolean;
};

const inputContainerRef = ref<HTMLElement | null>(null);

const props = withDefaults(defineProps<ComboboxRootProps & Props>(), {
  open: true,
  modelValue: "",
});

const emits = defineEmits<ComboboxRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const isOpen = ref(false);

const defaultFilterFunction = () => {
  return props.options;
};
const handleBlur = () => {
  // setTimeout(() => {
  //   isOpen.value = false;
  // }, 100); // Adjust delay as necessary
};

onClickOutside(inputContainerRef, (event) => {
  isOpen.value = false;
});
</script>

<template>
  <div
    class="w-full max-w-[450px] relative"
    v-bind="{
      class: $attrs.class ?? '',
      ...containerProps,
    }"
    ref="inputContainerRef"
  >
    <UiLabel v-if="label" class="mb-2">
      {{ label }}
    </UiLabel>
    <UiCommand
      v-bind="forwarded"
      :searchTerm="searchTerm"
      @update:search-term="
        (val) => {
          emits('update:searchTerm', val);
        }
      "
      class="rounded-lg border shadow-md bg-card"
      :filter-function="
        () => {
          return options.map((item) => item.value);
        }
      "
    >
      <UiCommandInput
        @focus="
          () => {
            isOpen = true;
          }
        "
        :placeholder="placeholder || 'Search...'"
        :auto-focus="false"
      />
      <ul
        v-if="isOpen"
        class="z-40 min-h absolute bottom-0 bg-card overflow-y-auto max-h-[300px] translate-y-full w-full"
      >
        <UiCommandEmpty v-if="options.length === 0"
          >No results found.</UiCommandEmpty
        >
        <UiCommandItem
          v-for="option in options"
          :value="option.value"
          @select="
            () => {
              if (onSelectOption) {
                onSelectOption(option);
              }
            }
          "
        >
          {{ option.label }}
        </UiCommandItem>
      </ul>
    </UiCommand>
  </div>
</template>
