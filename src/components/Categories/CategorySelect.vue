<script setup lang="ts">
import type { ICategory } from "~/@schemas/models/category";
import type { ISelectOption } from "~/@schemas/select";
import type { Nullish } from "~/@types/helpers";
import MultipleSelect from "~/components/Form/Field/MultipleSelect.vue";
import { getCategoryIcon } from "~/static/category-icons";

type IProps = {
  categories: ICategory[];
  modelValue: Nullish<string[]>;
  placeholder?: string;
  disabled?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  placeholder: "Todas",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const categoryOptions = computed<ISelectOption[]>(() => {
  return [...props.categories]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((category) => ({
      value: category.id,
      label: `${getCategoryIcon(category.icon)} ${category.name}`,
    }));
});
</script>

<template>
  <MultipleSelect
    :options="categoryOptions"
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @update:model-value="(value) => emit('update:modelValue', value as string[])"
  />
</template>
