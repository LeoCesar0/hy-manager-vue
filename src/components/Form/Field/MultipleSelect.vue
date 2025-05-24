<script setup lang="ts">
import { type ISelectOption } from "@/@schemas/select";
import { CheckIcon } from "lucide-vue-next";
import { computed } from "vue";
import { cn } from "@/lib/utils";
import type { SelectRootEmits, SelectRootProps } from "reka-ui";
import { SelectRoot, useForwardPropsEmits } from "reka-ui";
import type { Nullish } from "@common/type/helpers";

type Props = {
  options: ISelectOption[];
  placeholder?: string;
  disabled?: boolean;
  modelValue: Nullish<string[]>;
} & SelectRootProps;

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  disabled: false,
});

const emits = defineEmits<SelectRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const selectedLabels = computed(() => {
  if (!props.modelValue) return "";
  return (
    props.modelValue
      ?.map((val) => props.options.find((opt) => opt.value === val)?.label)
      .filter(Boolean)
      .slice(0, 5)
      .join("; ") + (props.modelValue.length > 5 ? "; ..." : "")
  );
});

const isSelected = (value: any) => {
  return props.modelValue?.includes(value);
};
</script>

<template>
  <RekaSelect v-bind="forwarded" multiple>
    <RekaSelectTrigger
      class="w-full"
      :class="
        cn({
          'text-muted-foreground': !selectedLabels,
        })
      "
    >
      <RekaSelectValue class="truncate">
        {{ selectedLabels || placeholder }}
      </RekaSelectValue>
    </RekaSelectTrigger>

    <RekaSelectContent>
      <RekaSelectGroup>
        <RekaSelectItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="relative"
        >
          <!-- @click.stop="toggleOption(option.value)" -->
          <div class="flex items-center gap-2 min-w-0">
            <UiCheckbox
              :checked="isSelected(option.value)"
              :disabled="disabled"
            />
            <template v-if="option.metadata?.status">
              <GoalIndicator :status="option.metadata.status" />
            </template>
            <slot name="option-icon" :option="option" />
            <!-- @update:checked="() => toggleOption(option.value)" -->
            <span class="flex-1 truncate">{{ option.label }}</span>
          </div>
        </RekaSelectItem>
      </RekaSelectGroup>
    </RekaSelectContent>
  </RekaSelect>
</template>

<style lang="scss" scoped>
:deep(.reka-select-item) {
  @apply py-1.5 px-2;

  &[data-highlighted] {
    @apply bg-accent text-accent-foreground;
  }

  &[data-disabled] {
    @apply opacity-50 pointer-events-none;
  }
}

:deep(.reka-select-trigger) {
  @apply flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50;
}

:deep(.reka-select-content) {
  @apply relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2;
}
</style>
