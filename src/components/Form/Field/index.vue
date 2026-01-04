<script setup lang="ts">
import { Field } from "vee-validate";
import { type ISelectOption } from "@/@schemas/select";
import { vAutoAnimate } from "@formkit/auto-animate";
import { cn } from "@lib/utils";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { EyeIcon } from "lucide-vue-next";
import FileUploaderMultiple from "~/components/Form/Field/FileUploaderMultiple.vue";
import type { IFileUploaderProps } from "~/components/Form/Field/FileUploaderMultiple.vue";
import ImageUploader from "~/components/Form/Field/ImageUploader.vue";
import type { IImageUploaderProps } from "~/components/Form/Field/ImageUploader.vue";
import InputWithOptions from "~/components/Form/Field/InputWithOptions.vue";
import MultipleSelect from "./MultipleSelect.vue";
import CardSelect from "~/components/Form/Field/CardSelect.vue";
import type { ICardSelectOption } from "~/components/Form/Field/CardSelectItem.vue";
import type { NumberFieldRootProps } from "reka-ui";
import type { IDatepickerProps } from "~/components/Datepicker/index.vue";
import { beautifyObjectName } from "~/helpers/shadcnui-utils/auto-form";

export type IFieldInputVariant =
  | "input"
  | "input-with-options"
  | "password"
  | "number"
  | "number-shadcn"
  | "select"
  | "multiple-select"
  | "card-select"
  | "datepicker"
  | "textarea"
  | "slider"
  | "sliderMultiple"
  | "checkbox"
  | "switch"
  | "file-multiple"
  | "image"
  | "custom";

type Props = {
  name: string;
  label?: string;
  inputVariant?: IFieldInputVariant;
  inputProps?: Record<string, any>;
  placeholder?: string;
  description?: string;
  class?: string;
  selectOptions?: ISelectOption<any>[];
  cardSelectOptions?: ICardSelectOption[];
  disabled?: boolean;
  datepickerProps?: IDatepickerProps;
  fileUploaderProps?: IFileUploaderProps;
  imageUploaderProps?: IImageUploaderProps;
  required?: boolean;
  topDescription?: string;
  inLineInput?: boolean;
  numberOptions?: NumberFieldRootProps;
  labelContainerClass?: string;
  autoLabel?: boolean;
  onSelectOption?: (option: ISelectOption) => void;
  inputOptions?: string[];
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
const showPass = ref(false);
</script>

<template>
  <Field v-slot="{ componentField, meta, field, value }" :name="name">
    <UiFormItem
      v-auto-animate
      :class="cn('flex gap-1 flex-col items-start w-full')"
    >
      <div
        :class="
          cn('flex-1 w-full', [
            {
              'flex items-center gap-3': isInLineInput,
              'flex gap-1 flex-col items-start': !isInLineInput,
            },
            props.class ?? '',
          ])
        "
      >
        <div :class="cn('flex items-center gap-2', labelContainerClass)">
          <UiFormLabel
            v-if="shownLabel"
            :disabled="disabled"
            :required="meta.required"
            >{{ shownLabel }}</UiFormLabel
          >
          <slot name="field-label-right" />
          <template v-if="inputVariant === 'slider'">
            <!-- show value -->
            <p class="text-sm text-muted-foreground">
              {{ componentField.modelValue }}
            </p>
          </template>
        </div>
        <slot name="field-header" />

        <div v-if="topDescription">
          <p
            class="text-muted-foreground text-sm mt-1 mb-1 whitespace-pre-line"
          >
            {{ topDescription }}
          </p>
        </div>
        <UiFormControl>
          <div class="flex items-start flex-1 w-full">
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
            <!-- PASSWORD -->
            <UiInput
              v-if="inputVariant === 'password'"
              class="!mt-0"
              :placeholder="placeholder ?? ''"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
                type: showPass ? 'text' : 'password',
              }"
            />
            <!-- NUMBER -->
            <UiInput
              v-if="inputVariant === 'number'"
              class="!mt-0"
              :placeholder="placeholder ?? ''"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
              }"
            />
            <!-- NUMBER SHADCN -->
            <NumberField
              v-if="inputVariant === 'number-shadcn'"
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
              @update:modelValue="
                (value) => {
                  if (onSelectOption) {
                    const option = selectOptions.find(
                      (option) => option.value === value
                    );
                    if (option) {
                      onSelectOption(option);
                    }
                  }
                }
              "
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
            <!-- MULTIPLE SELECT -->
            <MultipleSelect
              v-if="inputVariant === 'multiple-select'"
              class="!mt-0"
              :model-value="componentField.modelValue || []"
              :options="selectOptions"
              :placeholder="placeholder"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
              }"
            />

            <!-- datepicker -->
            <div v-if="inputVariant === 'datepicker'">
              <Datepicker
                class="!mt-0"
                v-bind="{
                  ...componentField,
                  disabled,
                  ...(props.inputProps ?? {}),
                  ...(props.datepickerProps ?? {}),
                }"
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
            <!-- FILE -->
            <FileUploaderMultiple
              v-if="inputVariant === 'file-multiple'"
              :name="name"
              :disabled="disabled"
              v-bind="{
                ...props.inputProps,
                ...(props.fileUploaderProps ?? {}),
              }"
            />
            <!-- IMAGE -->
            <ImageUploader
              v-if="inputVariant === 'image'"
              :name="name"
              :disabled="disabled"
              v-bind="{
                ...props.inputProps,
                ...(props.imageUploaderProps ?? {}),
              }"
            />
            <!-- INPUT WITH OPTIONS -->
            <InputWithOptions
              v-if="inputVariant === 'input-with-options'"
              class="!mt-0"
              :placeholder="placeholder ?? ''"
              :options="inputOptions"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
              }"
            />
            <!-- CARD SELECT -->
            <CardSelect
              v-if="inputVariant === 'card-select'"
              class="!mt-0"
              :options="cardSelectOptions || []"
              v-bind="{
                ...componentField,
                disabled,
                ...(props.inputProps ?? {}),
              }"
            />
            <UiButton
              v-if="inputVariant === 'password'"
              :variant="'ghost'"
              size="icon"
              type="button"
              :class="{
                'text-blue-500': showPass,
              }"
              @click="
                () => {
                  showPass = !showPass;
                }
              "
            >
              <EyeIcon />
            </UiButton>
            <slot name="input-right" />
          </div>
        </UiFormControl>
      </div>

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
