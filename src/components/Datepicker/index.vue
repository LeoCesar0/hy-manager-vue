<script setup lang="ts">
import { DateFormatter } from "@internationalized/date";
import { CalendarIcon } from "@radix-icons/vue";
import { cn } from "@lib/utils";
import { Cross2Icon } from "@radix-icons/vue";
import { useForwardPropsEmits, type CalendarRootProps } from "reka-ui";
import { parseToDate } from "~/helpers/parseToDate";
import { Timestamp } from "firebase/firestore";
import Calendar from "../ui/calendar/Calendar.vue";

export type IDatepickerProps = {
  disabled?: boolean;
  label?: string;
  cleanButton?: boolean;
  onCleanButton?: () => void;
  valueOnClean?: any;
  class?: string;
  containerProps?: Record<string, any>;
  labelInfo?: string;
} & CalendarRootProps;

const props = withDefaults(defineProps<IDatepickerProps>(), {
  cleanButton: true,
  valueOnClean: undefined,
});
const emit = defineEmits(["update:modelValue"]);
const forward = useForwardPropsEmits(props, emit);

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});
const formatDate = (value: (typeof props)["modelValue"]) => {
  if (
    typeof value === "string" ||
    value instanceof Date ||
    typeof value === "number" ||
    value instanceof Timestamp
  ) {
    const date = parseToDate(value);
    return df.format(date);
  }
  return "";
};
</script>

<template>
  <UiPopover v-slot="{ close }">
    <div
      :class="cn('w-full max-w-[250px]', props.class)"
      v-bind="{
        ...containerProps,
      }"
    >
      <UiLabel v-if="label" class="mb-2" :labelInfo="labelInfo">
        {{ label }}
      </UiLabel>
      <div class="flex items-center">
        <UiPopoverTrigger as-child :disabled="disabled">
          <UiButton
            variant="outline"
            :class="
              cn(
                'w-full justify-start text-left font-normal',
                !modelValue && 'text-muted-foreground',
                {
                  'rounded-r-none': cleanButton,
                }
              )
            "
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {{ modelValue ? formatDate(modelValue) : "Pick a date" }}
          </UiButton>
        </UiPopoverTrigger>
        <UiButton
          v-if="cleanButton"
          @click="
            () => {
              emit('update:modelValue', valueOnClean);
              if (onCleanButton) {
                onCleanButton();
              }
            }
          "
          variant="outline"
          size="icon"
          class="rounded-l-none border-l-0"
        >
          <Cross2Icon />
        </UiButton>
      </div>
    </div>
    <UiPopoverContent class="w-auto p-0">
      <Calendar
        v-model="modelValue"
        :default-placeholder="defaultPlaceholder"
        layout="month-and-year"
        initial-focus
        @update:model-value="close"
      />
    </UiPopoverContent>
  </UiPopover>
</template>
