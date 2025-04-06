<script setup lang="ts">
import { Field } from "vee-validate";
import { type ISelectOption } from "@/@schemas/select";
import { vAutoAnimate } from "@formkit/auto-animate";
import { cn } from "@lib/utils";
import type { VCalendarProps } from "~/components/ui/v-calendar/Calendar.vue";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import type { NumberFieldRootProps } from "radix-vue";
import { beautifyObjectName } from "~/helpers/shadcnui-utils/auto-form";

export type IFieldInputVariant =
  | "input"
  | "number"
  | "select"
  | "date"
  | "calendar"
  | "textarea"
  | "slider"
  | "sliderMultiple"
  | "checkbox"
  | "switch"
  | "custom";

type Props = {
  name: string;
  label?: string;
  inputVariant?: IFieldInputVariant;
  inputProps?: Record<string, any>;
  placeholder?: string;
  description?: string;
  class?: string;
  selectOptions?: ISelectOption[];
  disabled?: boolean;
  calendarProps?: VCalendarProps;
  required?: boolean;
  topDescription?: string;
  inLineInput?: boolean;
  numberOptions?: NumberFieldRootProps;
  labelContainerClass?: string;
  autoLabel?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  inputVariant: "input",
  selectOptions: () => [],
  disabled: false,
});
const inLineComponents: IFieldInputVariant[] = ["checkbox", "switch"];
const isInLineInput =
  props.inLineInput || inLineComponents.includes(props.inputVariant);

const shownLabel = computed(() => {
  if (props.label) return props.label;
  if (props.autoLabel) {
    return beautifyObjectName(props.name);
  }
  return "";
});
</script>

<template>
  <Field v-slot="{ componentField, meta }" :name="name">
    <UiFormItem
      :class="
        cn([
          {
            'flex items-center gap-3': isInLineInput,
            'flex gap-1 flex-col items-start': !isInLineInput,
          },
          props.class ?? '',
        ])
      "
      v-auto-animate
    >
      <div :class="cn('flex items-center gap-2', labelContainerClass)">
        <UiFormLabel v-if="shownLabel" :required="meta.required">{{
          shownLabel
        }}</UiFormLabel>
        <slot name="field-label-right" />
      </div>
      <slot name="field-header" />
      <div v-if="topDescription">
        <p class="text-muted-foreground text-sm mt-1 mb-1 whitespace-pre-line">
          {{ topDescription }}
        </p>
      </div>
      <UiFormControl>
        <div class="flex items-center flex-1 w-full">
          <!-- INPUT -->
          <UiInput
            v-if="inputVariant === 'input'"
            class="!mt-0"
            :placeholder="placeholder ?? ''"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
          />
          <!-- NUMBER -->
          <NumberField
            v-if="inputVariant === 'number'"
            class="!mt-0"
            :placeholder="placeholder ?? ''"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
              ...(numberOptions ?? {}),
            }"
          >
            <NumberFieldContent>
              <NumberFieldInput />
            </NumberFieldContent>
          </NumberField>
          <!-- TEXTAREA -->
          <UiTextarea
            v-if="inputVariant === 'textarea'"
            class="!mt-0"
            :placeholder="placeholder ?? ''"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
            :rows="props.inputProps?.rows || 5"
          />
          <!-- SLIDER -->
          <SliderSingle
            v-if="inputVariant === 'slider'"
            class="!mt-0"
            :placeholder="placeholder ?? ''"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
          />
          <!-- SLIDER MULTIPLE -->
          <UiSlider
            v-if="inputVariant === 'sliderMultiple'"
            class="!mt-0"
            :placeholder="placeholder ?? ''"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
          />
          <!-- CHECKBOX -->
          <UiCheckbox
            v-if="inputVariant === 'checkbox'"
            class="!mt-0"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
            :checked="componentField.modelValue"
            @update:checked="componentField['onUpdate:modelValue']"
          />
          <!-- SWITCH -->
          <UiSwitch
            v-if="inputVariant === 'switch'"
            class="!mt-0"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
            :checked="componentField.modelValue"
            @update:checked="componentField['onUpdate:modelValue']"
          />
          <!-- SELECT -->
          <UiSelect
            v-if="inputVariant === 'select'"
            class="!mt-0"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
          >
            <UiSelectTrigger class="w-full">
              <UiSelectValue :placeholder="placeholder ?? ''" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem
                v-for="option in selectOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
          <!-- DATE -->
          <div v-if="inputVariant === 'date'">
            <FormFieldCalendar
              class="!mt-0"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
                ...(props.calendarProps ?? {}),
              }"
            />
          </div>
          <!-- CALENDAR -->
          <div v-if="inputVariant === 'calendar'">
            <UiVCalendar
              class="!mt-0"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
                ...(props.calendarProps ?? {}),
              }"
            />
            />
          </div>
          <!-- CUSTOM -->
          <component
            v-if="inputVariant === 'custom'"
            :is="props.inputProps?.as || 'input'"
            class="!mt-0 w-full"
            v-bind="{
              ...componentField,
              disabled,
              ...(props.inputProps ?? {}),
            }"
            :value="componentField.modelValue"
          />
          <slot name="input-right" />
        </div>
      </UiFormControl>
      <UiFormDescription v-if="description">{{
        description
      }}</UiFormDescription>
      <UiFormMessage />
    </UiFormItem>
  </Field>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;
}
</style>
