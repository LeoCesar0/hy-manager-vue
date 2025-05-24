<script setup lang="ts">
import { ref, computed } from "vue";
import { useVModel, onClickOutside } from "@vueuse/core";
import { ChevronDownIcon } from "lucide-vue-next";
import { cn } from "@lib/utils";
import { slugify } from "~/helpers/slugify";

interface Props {
  modelValue?: string;
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const model = useVModel(props, "modelValue", emit);
const isOpen = ref(false);
const containerRef = ref<HTMLElement>();

const filteredOptions = computed(() => {
  if (!model.value) return props.options;
  const slug = slugify(model.value || "");
  return props.options.filter((option) => slugify(option).includes(slug));
});

const selectOption = (option: string) => {
  model.value = option;
  isOpen.value = false;
};

// Close when clicking outside
onClickOutside(containerRef, () => {
  isOpen.value = false;
});
</script>

<template>
  <div ref="containerRef" class="input-with-options relative w-full">
    <div class="flex items-center w-full">
      <UiInput
        v-model="model"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full"
        @focus="isOpen = true"
      />
      <UiButton
        type="button"
        variant="ghost"
        size="icon"
        class="absolute right-0"
        :disabled="disabled"
        @click="isOpen = !isOpen"
      >
        <ChevronDownIcon
          :class="
            cn('h-4 w-4 transition-transform', {
              'transform rotate-180': isOpen,
            })
          "
        />
      </UiButton>
    </div>

    <UiCard
      v-if="isOpen && filteredOptions.length > 0"
      :class="
        cn(
          'absolute w-full p-1  z-50  max-h-96 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1'
        )
      "
      :data-state="isOpen ? 'open' : 'closed'"
      data-side="bottom"
    >
      <UiScrollArea class="max-h-[200px]">
        <UiButton
          v-for="option in filteredOptions"
          :key="option"
          variant="ghost"
          class="w-full justify-start text-left py-1.5 px-2"
          @click="selectOption(option)"
          type="button"
        >
          {{ option }}
        </UiButton>
      </UiScrollArea>
    </UiCard>
  </div>
</template>

<style lang="scss" scoped>
.input-with-options {
}
</style>
