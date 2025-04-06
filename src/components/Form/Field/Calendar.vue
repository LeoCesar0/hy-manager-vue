<script setup lang="ts">
import { DateFormatter } from "@internationalized/date";
import { CalendarIcon } from "@radix-icons/vue";
import { cn } from "@lib/utils";
import { useForwardPropsEmits } from "radix-vue";
import { parseToDate } from "@common/helpers/parseToDate";
import type { VCalendarProps } from "~/components/ui/v-calendar/Calendar.vue";

type Props = {
  disabled?: boolean;
} & VCalendarProps;

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);
const forward = useForwardPropsEmits(props, emit);

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});
const formatDate = (value: (typeof props)["modelValue"]) => {
  if (
    typeof value === "string" ||
    value instanceof Date ||
    typeof value === "number"
  ) {
    const date = parseToDate(value);
    return df.format(date);
  }
  return "";
};
</script>

<template>
  <UiPopover>
    <UiPopoverTrigger as-child :disabled="disabled">
      <UiButton
        variant="outline"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground'
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ modelValue ? formatDate(modelValue) : "Pick a date" }}
      </UiButton>
    </UiPopoverTrigger>
    <UiPopoverContent class="w-auto p-0">
      <UiVCalendar v-bind="forward" />
    </UiPopoverContent>
  </UiPopover>
</template>
