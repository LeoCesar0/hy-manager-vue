<script setup lang="ts">
import { type HTMLAttributes, computed, watch } from "vue";
import type { SliderRootEmits, SliderRootProps } from "radix-vue";
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  useForwardPropsEmits,
} from "radix-vue";
import { cn } from "@/lib/utils";
import { isNullish } from "@common/helpers/isNullish";

const props = defineProps<
  Omit<SliderRootProps, "modelValue"> & {
    class?: HTMLAttributes["class"];
    modelValue?: number;
  }
>();

const emits = defineEmits<{
  "update:modelValue": [number | undefined];
}>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const innerValue = ref<number[]>(
  !isNullish(props.modelValue) ? [props.modelValue] : []
);

const forwarded = useForwardPropsEmits(delegatedProps, emits);

// Watch for changes in the array emitted by the Slider and update the modelValue accordingly
watch(
  innerValue,
  (newValue) => {
    console.log("❗ innerValue -->", newValue);
    if (Array.isArray(newValue) && newValue.length > 0) {
      emits("update:modelValue", newValue[0]); // Update with the first value of the array
    }
  },
  {
    deep: true,
    immediate: true,
  }
);
</script>

<template>
  <SliderRoot
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center',
        props.class
      )
    "
    v-bind="forwarded"
    v-model="innerValue"
  >
    <SliderTrack
      class="relative h-[16px] w-full grow overflow-hidden rounded-full bg-primary/20 cursor-pointer"
    >
      <SliderRange class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      :key="props.modelValue"
      class="block h-7 w-7 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    />
  </SliderRoot>
</template>
